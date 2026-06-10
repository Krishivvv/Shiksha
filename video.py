import subprocess
import logging
from pathlib import Path

import config

logger = logging.getLogger(__name__)

def merge_with_ffmpeg(video_path, audio_path, output_path):
    """Merge a video and audio file into a single MP4.  Raises on failure."""
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    command = [
        "ffmpeg",
        "-y",
        "-i", str(video_path),
        "-i", str(audio_path),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-shortest",
        str(output_path)
    ]

    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=config.FFMPEG_TIMEOUT)
    except subprocess.TimeoutExpired as e:
        logger.error("FFmpeg merge timed out for %s", output_path)
        raise RuntimeError(f"FFmpeg merge timed out after {config.FFMPEG_TIMEOUT}s") from e
    if result.returncode != 0:
        logger.error("FFmpeg merge failed for %s: %s", output_path, result.stderr)
        raise RuntimeError(f"FFmpeg merge failed: {result.stderr[:500]}")
    logger.info("Merged into %s", output_path)

def merge_videos(folder_path, output_path):
    """Concatenate all segment_*.mp4 files into a single video.  Raises on failure."""
    folder = Path(folder_path).resolve()  # Make absolute path
    video_files = sorted(folder.glob("segment_*.mp4"))

    if not video_files:
        raise RuntimeError(f"No segment_*.mp4 files found in {folder}")

    concat_file = folder / "concat_list.txt"

    # Use absolute paths in list file
    with open(concat_file, "w", encoding="utf-8") as f:
        for file in video_files:
            f.write(f"file '{file.as_posix()}'\n")

    # Build FFmpeg command
    command = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", str(concat_file),
        "-c", "copy",
        str(Path(output_path).resolve())
    ]

    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=config.FFMPEG_TIMEOUT)
    except subprocess.TimeoutExpired as e:
        logger.error("FFmpeg concat timed out")
        raise RuntimeError(f"FFmpeg concat timed out after {config.FFMPEG_TIMEOUT}s") from e
    if result.returncode != 0:
        logger.error("FFmpeg concat failed: %s", result.stderr)
        raise RuntimeError(f"FFmpeg concat failed: {result.stderr[:500]}")
    logger.info("Merged all segments into %s", output_path)