import os
import subprocess
import logging
from fpdf import FPDF

logger = logging.getLogger(__name__)


def extract_last_frame(video_path, output_image_path):
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-sseof", "-1", "-i", video_path, "-vframes", "1", output_image_path],
            check=True,
            capture_output=True,
        )
    except subprocess.CalledProcessError as e:
        logger.warning("FFmpeg frame extraction failed for %s: %s", video_path, e.stderr.decode(errors="replace"))
    return output_image_path


class NotesPDF(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=15)
        self.set_font("Helvetica", size=12)

    def add_segment(self, title, notes, image_path=None):
        self.add_page()
        self.set_font("Helvetica", "B", size=14)
        self.cell(0, 10, title, ln=True)
        self.set_font("Helvetica", "", size=12)
        self.multi_cell(0, 10, notes)
        if image_path and os.path.exists(image_path):
            self.ln(5)
            self.image(image_path, w=160)


def generate_pdf(notes_list, output_path="study_notes.pdf"):
    pdf = NotesPDF()
    for segment in notes_list:
        pdf.add_segment(
            title=segment['id'].replace("_", " ").title(),
            notes=segment['notes'],
            image_path=segment.get('image_path'),
        )
    pdf.output(output_path)
