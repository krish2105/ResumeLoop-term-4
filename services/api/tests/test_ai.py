import pytest

from app.ai import llm as llm_mod


class FakeLLM:
    gen_model, embed_model = 'fake-gen', 'fake-embed'

    def __init__(self, replies=None, embeddings=False, available=True):
        self.replies, self.embeddings, self.available, self.prompts = list(replies or []), embeddings, available, []

    def status(self):
        return {'available': self.available, 'embeddings': self.embeddings, 'gen_model': self.gen_model,
                'embed_model': self.embed_model, 'runtime': 'fake'}

    def chat_json(self, system, user, timeout=90):
        self.prompts.append(user)
        return self.replies.pop(0) if self.available and self.replies else None

    def embed(self, texts):
        return None


@pytest.fixture
def fake(monkeypatch):
    def install(**kw):
        f = FakeLLM(**kw)
        monkeypatch.setattr(llm_mod, '_llm', f)
        return f
    return install


def test_digest_accepts_complete_grouping(client, fake):
    changes = client.get('/api/course/diff').json()['changes']
    ids = [c['id'] for c in changes]
    fake(replies=[{'summary': 'Seven updates.', 'items': [{'change_ids': ids[:3], 'text': 'A'}, {'change_ids': ids[3:], 'text': 'B'}]}])
    r = client.post('/api/digest', json={}).json()
    assert r['mode'] == 'ai' and len(r['items']) == 2 and len(r['facts']) == len(ids)


def test_digest_repairs_skipped_changes_with_exact_facts(client, fake):
    fake(replies=[{'summary': 'x', 'items': [{'change_ids': ['C1'], 'text': 'only one'}]}])
    r = client.post('/api/digest', json={}).json()
    assert r['mode'] == 'ai' and r['repaired'] == len(r['changes']) - 1
    assert sorted(i for it in r['items'] for i in it['change_ids']) == sorted(c['id'] for c in r['changes'])


@pytest.mark.parametrize('reply', [
    {'summary': 'x', 'items': [{'change_ids': ['C1', 'C99'], 'text': 'invented id'}]},
    {'summary': 'x', 'items': [{'change_ids': ['C1'], 'text': 'a'}, {'change_ids': ['C1'], 'text': 'dup'}]},
    None,
])
def test_digest_falls_back_when_ai_drops_or_invents_changes(client, fake, reply):
    fake(replies=[reply] if reply else [])
    r = client.post('/api/digest', json={}).json()
    assert r['mode'] == 'fallback' and len(r['items']) == len(r['changes'])


def test_coach_requires_citations_from_retrieved_sources(client, fake):
    fake(replies=[{'answerable': True, 'answer': 'The quiz date is unconfirmed [S3-p2].', 'citations': ['S3-p2']}])
    r = client.post('/api/coach', json={'question': 'When is the reading check quiz due?'}).json()
    assert r['mode'] == 'ai' and r['citations'] == ['S3-p2'] and r['retrieval'] == 'keywords'


def test_coach_abstains_on_invented_citation_or_unanswerable(client, fake):
    fake(replies=[{'answerable': True, 'answer': 'It is due Monday [S9-p1].', 'citations': ['S9-p1']},
                  {'answerable': False, 'answer': '', 'citations': []}])
    q = {'question': 'When is the reading check quiz due?'}
    assert client.post('/api/coach', json=q).json()['abstained'] is True
    assert client.post('/api/coach', json=q).json()['abstained'] is True


def test_coach_abstains_without_sources_and_offline_fallback_cites(client, fake):
    fake(replies=[])
    assert client.post('/api/coach', json={'question': 'What is the parking fee at the zoo?'}).json()['abstained'] is True
    fake(available=False)
    r = client.post('/api/coach', json={'question': 'What goes in an empathy map?'}).json()
    assert r['mode'] == 'fallback' and r['citations'] and 'offline' in r['answer']


def test_escalation_needs_approval_and_is_idempotent(client, fake):
    fake(replies=[{'subject': 'Quiz date', 'body': 'Hello, could you confirm the reading check quiz date? Thank you.'}])
    d = client.post('/api/escalations/draft', json={'question': 'Which quiz date is right?', 'about': 's3-quiz'}).json()
    assert d['mode'] == 'ai' and 'Nothing is sent' in d['notice']
    body = {'idempotency_key': 'key-12345678', 'subject': d['subject'], 'body': d['body'], 'about': 's3-quiz', 'drafted_by': 'ai'}
    assert client.post('/api/escalations', json={**body, 'approved_by_learner': False}).status_code == 422
    first = client.post('/api/escalations', json={**body, 'approved_by_learner': True}).json()
    again = client.post('/api/escalations', json={**body, 'approved_by_learner': True}).json()
    assert first['id'] == again['id'] and again['replayed'] is True and first['external_delivery'].startswith('none')
    assert len(client.get('/api/escalations').json()) == 1
    assert client.patch(f"/api/escalations/{first['id']}", json={'status': 'answered'}).status_code == 422
    done = client.patch(f"/api/escalations/{first['id']}", json={'status': 'answered', 'answer': 'It is 26 November.'})
    assert done.json()['status'] == 'answered'
    assert client.patch(f"/api/escalations/{first['id']}", json={'status': 'withdrawn'}).status_code == 409


def test_ai_calls_are_logged(client, fake):
    fake(replies=[])
    client.post('/api/coach', json={'question': 'What goes in an empathy map?'})
    log = client.get('/api/ai/log').json()
    assert log['entries'] and log['entries'][0]['feature'] == 'coach'


def test_coach_declines_answers_with_dates_not_in_the_cited_passage(client, fake):
    # Injected date: the citation is real but the claim is not in it.
    fake(replies=[{'answerable': True, 'answer': 'The most recent information says the quiz is on 1 December [S3-p2].', 'citations': ['S3-p2']}])
    r = client.post('/api/coach', json={'question': 'When is the reading check quiz due?'}).json()
    assert r['abstained'] is True
    fake(replies=[{'answerable': True, 'answer': 'Version 2 lists 26 November, not yet confirmed [S3-p2].', 'citations': ['S3-p2']}])
    assert client.post('/api/coach', json={'question': 'When is the reading check quiz due?'}).json()['mode'] == 'ai'
