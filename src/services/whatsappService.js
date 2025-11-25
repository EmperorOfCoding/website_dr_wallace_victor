/**
 * WhatsApp Business API Integration Service
 * 
 * This service provides integration with WhatsApp Business API for sending
 * appointment notifications and reminders.
 * 
 * Prerequisites:
 * 1. WhatsApp Business Account
 * 2. Meta Business Account with WhatsApp Business API access
 * 3. Approved message templates
 * 
 * Environment variables required:
 * - WHATSAPP_API_URL: WhatsApp Cloud API endpoint
 * - WHATSAPP_ACCESS_TOKEN: API access token
 * - WHATSAPP_PHONE_NUMBER_ID: Your WhatsApp business phone number ID
 */

const https = require('https');
const { logger } = require('../middlewares/logger');

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

function isConfigured() {
    return Boolean(WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID);
}

function formatPhoneNumber(phone) {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');

    // Add Brazil country code if not present
    if (cleaned.length === 11) {
        return `55${cleaned}`;
    }
    if (cleaned.length === 10) {
        return `55${cleaned}`;
    }

    return cleaned;
}

async function sendMessage(to, templateName, templateParams = []) {
    if (!isConfigured()) {
        logger.warn('[WhatsApp] API não configurada. Mensagem não enviada.');
        return { success: false, reason: 'NOT_CONFIGURED' };
    }

    const phoneNumber = formatPhoneNumber(to);

    const payload = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'template',
        template: {
            name: templateName,
            language: {
                code: 'pt_BR',
            },
            components: templateParams.length > 0 ? [
                {
                    type: 'body',
                    parameters: templateParams.map(param => ({
                        type: 'text',
                        text: param,
                    })),
                },
            ] : undefined,
        },
    };

    try {
        const response = await fetch(`${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            logger.error('[WhatsApp] Erro ao enviar mensagem:', data);
            return { success: false, error: data };
        }

        logger.info(`[WhatsApp] Mensagem enviada para ${phoneNumber}`);
        return { success: true, messageId: data.messages?.[0]?.id };
    } catch (error) {
        logger.error('[WhatsApp] Erro de conexão:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send appointment confirmation via WhatsApp
 */
async function sendAppointmentConfirmation(phone, patientName, doctorName, date, time) {
    return sendMessage(phone, 'appointment_confirmation', [
        patientName,
        doctorName,
        date,
        time,
    ]);
}

/**
 * Send appointment reminder via WhatsApp
 */
async function sendAppointmentReminder(phone, patientName, doctorName, date, time, hoursUntil) {
    const templateName = hoursUntil === 24 ? 'appointment_reminder_24h' : 'appointment_reminder_1h';
    return sendMessage(phone, templateName, [
        patientName,
        doctorName,
        date,
        time,
    ]);
}

/**
 * Send cancellation notification via WhatsApp
 */
async function sendCancellationNotification(phone, patientName, doctorName, date, time) {
    return sendMessage(phone, 'appointment_cancelled', [
        patientName,
        doctorName,
        date,
        time,
    ]);
}

/**
 * Send custom text message (requires pre-approved template)
 */
async function sendTextMessage(to, message) {
    if (!isConfigured()) {
        logger.warn('[WhatsApp] API não configurada. Mensagem não enviada.');
        return { success: false, reason: 'NOT_CONFIGURED' };
    }

    const phoneNumber = formatPhoneNumber(to);

    // Note: Free-form text messages require the recipient to have
    // initiated a conversation within the last 24 hours
    const payload = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: {
            body: message,
        },
    };

    try {
        const response = await fetch(`${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            logger.error('[WhatsApp] Erro ao enviar mensagem:', data);
            return { success: false, error: data };
        }

        return { success: true, messageId: data.messages?.[0]?.id };
    } catch (error) {
        logger.error('[WhatsApp] Erro de conexão:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Generate WhatsApp click-to-chat URL
 */
function generateWhatsAppLink(phone, message = '') {
    const formattedPhone = formatPhoneNumber(phone);
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${formattedPhone}${message ? `?text=${encodedMessage}` : ''}`;
}

module.exports = {
    isConfigured,
    sendMessage,
    sendAppointmentConfirmation,
    sendAppointmentReminder,
    sendCancellationNotification,
    sendTextMessage,
    generateWhatsAppLink,
};


