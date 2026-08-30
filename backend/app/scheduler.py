from apscheduler.schedulers.background import BackgroundScheduler
from app.database import SessionLocal
from app.services.exchange_rate_service import update_exchange_rates
import logging

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()

def fetch_daily_rates():
    logger.info("Running scheduled task: fetch_daily_rates")
    db = SessionLocal()
    try:
        update_exchange_rates(db)
    finally:
        db.close()

def start_scheduler():
    # Run daily at 00:00 UTC (Midnight)
    scheduler.add_job(fetch_daily_rates, 'cron', hour=0, minute=0, timezone='UTC')
    scheduler.start()
    logger.info("Scheduler started.")

def shutdown_scheduler():
    scheduler.shutdown()
    logger.info("Scheduler shut down.")
