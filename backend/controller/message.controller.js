import { sendMessage, getMessages, getBroadcastMessages, getBookingMessages, getConversation } from '../service/message.service.js';

export async function sendMessageController(req, res) {
  const { tourId, senderId, receiverId, recipientId, content, messageText, isBroadcast, bookingId } = req.body;
  
  // Support both field names for compatibility
  const actualContent = content || messageText;
  const actualRecipient = recipientId || receiverId;
  
  const result = await sendMessage({ 
    tourId, 
    senderId, 
    recipientId: actualRecipient, 
    content: actualContent, 
    isBroadcast,
    bookingId 
  });
  
  if (result.error) return res.status(400).json({ success: false, message: result.error });
  res.json({ success: true, message: 'Message sent.', data: result.message });
}

export async function getMessagesController(req, res) {
  const { tourId, recipientId } = req.query;
  const messages = await getMessages({ tourId, recipientId });
  res.json({ success: true, messages });
}

export async function getBookingMessagesController(req, res) {
  const { bookingId } = req.params;
  const messages = await getBookingMessages({ bookingId });
  res.json({ success: true, messages });
}

export async function getBroadcastMessagesController(req, res) {
  const { tourId } = req.query;
  const messages = await getBroadcastMessages({ tourId });
  res.json({ success: true, messages });
}

export async function getConversationController(req, res) {
  // expects query params: userA, userB
  const { userA, userB } = req.query;
  if (!userA || !userB) return res.status(400).json({ success: false, message: 'userA and userB are required' });
  const messages = await getConversation({ userA, userB });
  res.json({ success: true, messages });
}
