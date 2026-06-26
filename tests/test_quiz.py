"""Quiz generation: parse the LLM's Q/A block, with the model mocked."""

from shiksha.pipeline import quiz

_GOOD = """
Q: What is 2+2?
A. 3
B. 4
C. 5
D. 6
Answer: B

Q: Capital of France?
A. Rome
B. Berlin
C. Paris
D. Madrid
Answer: C

Q: Largest planet?
A. Earth
B. Mars
C. Jupiter
D. Venus
Answer: C

Q: H2O is?
A. Salt
B. Water
C. Acid
D. Base
Answer: B
"""


class _Resp:
    def __init__(self, text):
        self.text = text


class _FakeClient:
    def __init__(self, text):
        self._text = text

    @property
    def models(self):
        return self

    def generate_content(self, *a, **k):
        return _Resp(self._text)


def test_quiz_parses_four_or_more(monkeypatch):
    monkeypatch.setattr(quiz, "_get_client", lambda: _FakeClient(_GOOD))
    out = quiz.generate_quiz([{"voice_script": "lesson text"}])
    assert len(out) == 4
    assert out[0][0] == "What is 2+2?"
    assert out[0][5] == "B"


def test_quiz_too_few_returns_empty(monkeypatch):
    one = "Q: Only one?\nA. a\nB. b\nC. c\nD. d\nAnswer: A"
    monkeypatch.setattr(quiz, "_get_client", lambda: _FakeClient(one))
    assert quiz.generate_quiz([{"voice_script": "x"}]) == []


def test_quiz_swallows_errors(monkeypatch):
    def boom():
        raise RuntimeError("no key")
    monkeypatch.setattr(quiz, "_get_client", boom)
    assert quiz.generate_quiz([{"voice_script": "x"}]) == []
