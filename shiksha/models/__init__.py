from datetime import datetime

from flask_login import UserMixin
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model, UserMixin):
    id         = db.Column(db.Integer, primary_key=True)
    username   = db.Column(db.String(80), unique=True, nullable=False)
    email      = db.Column(db.String(120), unique=True, nullable=False)
    password   = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    videos     = db.relationship('Video', backref='user', lazy=True)


class Video(db.Model):
    id                  = db.Column(db.Integer, primary_key=True)
    filename            = db.Column(db.String(255), nullable=False)
    filepath            = db.Column(db.String(255), nullable=False)
    prompt_text         = db.Column(db.Text, nullable=True)
    attachment_filename = db.Column(db.String(255), nullable=True)
    status              = db.Column(db.String(20), default="pending")   # pending/processing/completed/failed
    task_id             = db.Column(db.String(100), nullable=True, index=True)
    error_message       = db.Column(db.Text, nullable=True)
    duration_minutes    = db.Column(db.Integer, nullable=True)
    user_id             = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at          = db.Column(db.DateTime, default=datetime.utcnow)
    quizzes             = db.relationship('Quiz', backref='video', lazy=True)


class Quiz(db.Model):
    id         = db.Column(db.Integer, primary_key=True)
    video_id   = db.Column(db.Integer, db.ForeignKey('video.id'), nullable=False)
    questions  = db.Column(db.Text, nullable=False)  # JSON array of question tuples
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
