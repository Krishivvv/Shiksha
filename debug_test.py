import traceback, os, sys
from dotenv import load_dotenv
load_dotenv()

import app as flask_app

with flask_app.app.app_context():
    from models import User, Video
    from werkzeug.security import generate_password_hash
    from werkzeug.utils import secure_filename
    from progress import set_progress
    import uuid

    u = User.query.filter_by(username='debuguser').first()
    if not u:
        u = User(username='debuguser', email='dbg3@test.com',
                 password=generate_password_hash('debug123'))
        flask_app.db.session.add(u)
        flask_app.db.session.commit()

    print("User OK:", u.id, u.username)

    task_id = str(uuid.uuid4())
    prompt = 'Explain photosynthesis'
    username = u.username
    user_id = u.id

    words = prompt.split()
    joined = '_'.join(words[:10])
    computed_filename = secure_filename(f"{user_id}_{joined}.mp4")
    user_output_folder = os.path.join('output', f'{username}_output')
    os.makedirs(user_output_folder, exist_ok=True)
    output_file_path = os.path.join(user_output_folder, computed_filename)

    print("Filename:", computed_filename)
    print("Output path:", output_file_path)

    try:
        nv = Video(
            user_id=user_id,
            filename=computed_filename,
            filepath=output_file_path,
            prompt_text=prompt,
            task_id=task_id,
            status='processing',
            attachment_filename=None,
        )
        flask_app.db.session.add(nv)
        flask_app.db.session.commit()
        print("Video DB record created, id:", nv.id)
    except Exception:
        print("=== DB ERROR ===")
        traceback.print_exc()
        sys.exit(1)

    try:
        set_progress({'state': 'processing', 'step': 'Test', 'message': ''}, user_id=task_id)
        print("Redis OK")
    except Exception:
        print("=== REDIS ERROR ===")
        traceback.print_exc()
        sys.exit(1)

    print("\nAll pre-thread checks passed. The 500 must be inside the thread.")
    print("Now testing generate_video import...")
    try:
        from main import generate_video
        print("generate_video import OK")
    except Exception:
        print("=== IMPORT ERROR in main.py ===")
        traceback.print_exc()
