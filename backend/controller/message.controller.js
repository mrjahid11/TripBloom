import { sendMessage, getMessages, getBroadcastMessages } from '../service/message.service.js';

export async function sendMessageController(req, res) {
  const { tourId, senderId, recipientId, content, isBroadcast } = req.body;
  const result = await sendMessage({ tourId, senderId, recipientId, content, isBroadcast });
  if (result.error) return res.status(400).json({ success: false, message: result.error });
  res.json({ success: true, message: 'Message sent.', data: result.message });
}

export async function getMessagesController(req, res) {
  const { tourId, recipientId } = req.query;
  const messages = await getMessages({ tourId, recipientId });
  res.json({ success: true, messages });
}

export async function getBroadcastMessagesController(req, res) {
  const { tourId } = req.query;
  const messages = await getBroadcastMessages({ tourId });
  res.json({ success: true, messages });
}
