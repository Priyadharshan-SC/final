import logging
import time
from app.config import settings

logger = logging.getLogger("PLCActuator")

class PLCActuator:
    """
    Serial / GPIO Hardware driver for physical pneumatic ejector relay.
    Fires sub-millisecond electrical signals when defective board is detected.
    """
    def __init__(self):
        self.connected = False
        self.ser = None
        self._init_connection()

    def _init_connection(self):
        if settings.MOCK_PLC:
            logger.info("PLC Actuator initialized in MOCK mode.")
            self.connected = True
            return

        try:
            import serial
            self.ser = serial.Serial(settings.SERIAL_PORT, settings.BAUD_RATE, timeout=0.05)
            self.connected = True
            logger.info(f"Connected to physical PLC Actuator at {settings.SERIAL_PORT}")
        except Exception as e:
            logger.warning(f"Failed to connect to PLC hardware on {settings.SERIAL_PORT}: {e}. Falling back to mock mode.")
            self.connected = False

    def trigger_reject(self):
        """
        Sends hardware pulse to eject defective PCB off conveyer belt.
        """
        start_t = time.perf_counter()
        if settings.MOCK_PLC or not self.connected or self.ser is None:
            logger.info("[MOCK PLC] Ejector Relay Pulses HIGH -> PCB REJECTED")
            return True, round((time.perf_counter() - start_t) * 1000.0, 3)

        try:
            self.ser.write(b"REJECT\n")
            self.ser.flush()
            actuation_ms = round((time.perf_counter() - start_t) * 1000.0, 3)
            logger.info(f"Physical PLC Actuation pulse sent in {actuation_ms}ms")
            return True, actuation_ms
        except Exception as e:
            logger.error(f"Error signaling PLC actuator: {e}")
            return False, 0.0

# Shared PLC Actuator driver instance
plc_actuator = PLCActuator()
