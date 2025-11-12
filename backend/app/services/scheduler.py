"""
Scheduler service for background tasks using APScheduler
"""
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from ..core.database import SessionLocal
from .inventory_alerts import generate_inventory_alerts, record_stock_history, check_price_alerts

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def run_alert_generation():
    """Scheduled task to generate inventory alerts"""
    db = SessionLocal()
    try:
        logger.info("Running scheduled alert generation...")
        result = generate_inventory_alerts(db)
        logger.info(f"Alert generation completed: {result['alerts_created']} created, {result['alerts_updated']} updated")
    except Exception as e:
        logger.error(f"Error in alert generation: {e}")
    finally:
        db.close()


def run_stock_history_recording():
    """Scheduled task to record stock history"""
    db = SessionLocal()
    try:
        logger.info("Recording stock history...")
        record_stock_history(db)
        logger.info("Stock history recorded successfully")
    except Exception as e:
        logger.error(f"Error recording stock history: {e}")
    finally:
        db.close()


def run_price_alerts():
    """Scheduled task to check for price changes"""
    db = SessionLocal()
    try:
        logger.info("Checking for price alerts...")
        alerts_created = check_price_alerts(db)
        logger.info(f"Price alerts check completed: {alerts_created} alerts created")
    except Exception as e:
        logger.error(f"Error checking price alerts: {e}")
    finally:
        db.close()


def start_scheduler():
    """Start the background scheduler"""
    # Generate alerts every hour
    scheduler.add_job(
        run_alert_generation,
        trigger=IntervalTrigger(hours=1),
        id='generate_alerts',
        name='Generate Inventory Alerts',
        replace_existing=True
    )
    
    # Record stock history every 6 hours
    scheduler.add_job(
        run_stock_history_recording,
        trigger=IntervalTrigger(hours=6),
        id='record_stock_history',
        name='Record Stock History',
        replace_existing=True
    )
    
    # Check price alerts every 4 hours
    scheduler.add_job(
        run_price_alerts,
        trigger=IntervalTrigger(hours=4),
        id='check_price_alerts',
        name='Check Price Alerts',
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("Background scheduler started")


def stop_scheduler():
    """Stop the background scheduler"""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Background scheduler stopped")

