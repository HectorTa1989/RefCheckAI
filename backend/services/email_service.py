"""Email notifications via Resend."""
from __future__ import annotations
import resend
from db.client import get_settings

settings = get_settings()
resend.api_key = settings.resend_api_key


RECOMMENDATION_LABELS = {
    "strong_yes": "Strong Yes ✅",
    "yes": "Yes ✅",
    "neutral": "Neutral ⚪",
    "no": "No ❌",
    "strong_no": "Strong No ❌",
}


def send_check_complete_email(
    recruiter_email: str,
    candidate_name: str,
    role: str,
    overall_score: float,
    recommendation: str,
    report_url: str,
) -> None:
    """Send a completion notification to the recruiter."""

    rec_label = RECOMMENDATION_LABELS.get(recommendation, recommendation)
    score_color = (
        "#34C759" if overall_score >= 7.0
        else "#FF9F0A" if overall_score >= 5.0
        else "#FF3B30"
    )

    html = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #F5F5F7; margin: 0; padding: 40px 20px; }}
    .card {{ background: white; border-radius: 16px; padding: 40px;
             max-width: 560px; margin: 0 auto;
             box-shadow: 0 2px 16px rgba(0,0,0,0.08); }}
    .logo {{ font-size: 18px; font-weight: 700; color: #0071E3;
             letter-spacing: -0.3px; margin-bottom: 32px; }}
    h1 {{ font-size: 22px; font-weight: 700; color: #1D1D1F;
          margin: 0 0 8px; letter-spacing: -0.3px; }}
    .role {{ color: #6E6E73; font-size: 15px; margin-bottom: 32px; }}
    .score-row {{ display: flex; align-items: center; gap: 16px;
                  padding: 20px; background: #F5F5F7; border-radius: 12px;
                  margin-bottom: 24px; }}
    .score-val {{ font-size: 36px; font-weight: 800;
                  color: {score_color}; letter-spacing: -1px; }}
    .score-label {{ font-size: 13px; color: #6E6E73; }}
    .rec {{ font-size: 17px; font-weight: 600; color: {score_color}; }}
    .btn {{ display: inline-block; background: #0071E3; color: white;
            text-decoration: none; padding: 14px 28px; border-radius: 980px;
            font-size: 15px; font-weight: 600; margin-top: 24px; }}
    .footer {{ margin-top: 32px; font-size: 12px; color: #AEAEB2; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">RefCheck AI</div>
    <h1>Reference check complete — {candidate_name}</h1>
    <div class="role">{role}</div>
    <div class="score-row">
      <div>
        <div class="score-val">{overall_score:.1f}<span style="font-size:18px;color:#6E6E73">/10</span></div>
        <div class="score-label">Overall reference score</div>
      </div>
      <div style="width:1px;height:48px;background:#E5E5EA"></div>
      <div>
        <div class="rec">{rec_label}</div>
        <div class="score-label">Recommendation</div>
      </div>
    </div>
    <a href="{report_url}" class="btn">View Full Report →</a>
    <div class="footer">
      Sent by RefCheck AI · Unsubscribe
    </div>
  </div>
</body>
</html>
"""

    resend.Emails.send({
        "from": settings.resend_from_email,
        "to": [recruiter_email],
        "subject": f"RefCheck complete — {candidate_name} · {overall_score:.1f}/10",
        "html": html,
    })
