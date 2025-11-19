import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, ListGroup, Form, Button } from 'react-bootstrap';
import { messagesAPI, usersAPI } from '../services/api';
import { toast } from 'react-toastify';
import { toastError } from '../utils/errors';
import { validateMessageForm } from '../utils/validation';

function Messages({ user }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setContactsLoading(false);
      return;
    }
    setLoading(true);
    setContactsLoading(true);
    fetchConversations();
    fetchContacts();
  }, [user]);

  const fetchConversations = async () => {
    try {
      const response = await messagesAPI.getConversations();
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const roles =
        user?.role === 'farmer'
          ? ['buyer']
          : user?.role === 'buyer'
          ? ['farmer']
          : ['farmer', 'buyer'];

      const results = await Promise.all(
        roles.map(role => usersAPI.getByRole(role))
      );

      // Flatten and de-duplicate by uid
      const merged = results
        .flatMap(res => res.data.users || [])
        .reduce((acc, curr) => {
          if (!acc.some(existing => existing.uid === curr.uid)) {
            acc.push(curr);
          }
          return acc;
        }, []);

      setContacts(merged);
    } catch (error) {
      toastError(toast, error, 'Failed to load contacts');
    } finally {
      setContactsLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await messagesAPI.getMessages(conversationId);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleConversationClick = (conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id);
  };

  const startConversationWithUser = (contact) => {
    const conversation = {
      id: contact.uid,
      participants: [user.uid, contact.uid],
      participantDetails: {
        [user.uid]: { uid: user.uid },
        [contact.uid]: contact,
      },
      lastMessage: '',
      lastMessageAt: new Date(),
    };

    setSelectedConversation(conversation);
    setConversations((prev) => {
      const exists = prev.find((conv) => conv.id === conversation.id);
      if (exists) return prev;
      return [...prev, conversation];
    });
    fetchMessages(contact.uid);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!user?.uid) {
      toast.error('Please sign in to send messages.');
      return;
    }

    if (!selectedConversation) {
      toast.error('Please select a conversation to send a message.');
      console.error('handleSendMessage error: No conversation selected.');
      return;
    }

    const { valid, errors, cleaned } = validateMessageForm({ content: newMessage });

    if (!valid) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    try {
      const otherParticipant = selectedConversation.participants?.find(
        (p) => p !== user.uid
      );

      if (!otherParticipant) {
        toast.error('No recipient found for this conversation.');
        return;
      }

      await messagesAPI.send({
        receiverId: otherParticipant,
        conversationId: selectedConversation.id,
        content: cleaned.content,
      });

      setNewMessage('');
      fetchMessages(selectedConversation.id);
      fetchConversations();
    } catch (error) {
      toastError(toast, error, 'Failed to send message');
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-success"></div>
      </Container>
    );
  }

  const isSendDisabled = !selectedConversation || !newMessage.trim();

  return (
    <Container fluid className="py-4">
      <h1 className="mb-4">
        <i className="bi bi-chat-dots me-2"></i>
        Messages
      </h1>

      <Row>
        <Col md={4} className="d-flex flex-column gap-3">
          <Card className="shadow-sm" style={{ height: '70vh', overflowY: 'auto' }}>
            <Card.Header>
              <strong>Conversations</strong>
            </Card.Header>
            <ListGroup variant="flush">
              {conversations.length === 0 ? (
                <ListGroup.Item className="text-center text-muted py-4">
                  No conversations yet
                </ListGroup.Item>
              ) : (
                conversations.map(conv => {
                  const participantDetails = conv.participantDetails || {};
                  const otherParticipant = Object.keys(participantDetails).find(
                    id => id !== user.uid
                  ) || conv.id;
                  const otherUser = participantDetails[otherParticipant] || {};
                  const lastMessageDate = conv.lastMessageAt ? new Date(conv.lastMessageAt) : null;

                  return (
                    <ListGroup.Item
                      key={conv.id}
                      action
                      active={selectedConversation?.id === conv.id}
                      onClick={() => handleConversationClick(conv)}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <strong>{otherUser?.name || 'Conversation'}</strong>
                          <p className="mb-0 text-muted small">{conv.lastMessage || 'Start chatting'}</p>
                        </div>
                        {lastMessageDate && (
                          <small className="text-muted">
                            {lastMessageDate.toLocaleDateString()}
                          </small>
                        )}
                      </div>
                    </ListGroup.Item>
                  );
                })
              )}
            </ListGroup>
          </Card>

          <Card className="shadow-sm" style={{ height: '50vh', overflowY: 'auto' }}>
            <Card.Header>
              <strong>
                {user?.role === 'farmer'
                  ? 'Buyers'
                  : user?.role === 'buyer'
                  ? 'Farmers'
                  : 'Users'}{' '}
                directory
              </strong>
            </Card.Header>
            <ListGroup variant="flush">
              {contactsLoading ? (
                <ListGroup.Item className="text-center text-muted py-4">
                  Loading contacts...
                </ListGroup.Item>
              ) : contacts.length === 0 ? (
                <ListGroup.Item className="text-center text-muted py-4">
                  No contacts available yet
                </ListGroup.Item>
              ) : (
                contacts
                  .filter(contact => contact.uid !== user.uid)
                  .map(contact => (
                    <ListGroup.Item key={contact.uid}>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <strong>{contact.name || (contact.role === 'farmer' ? 'Farmer' : 'Buyer')}</strong>
                          <p className="mb-0 text-muted small">{contact.location?.state || contact.email}</p>
                        </div>
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => startConversationWithUser(contact)}
                        >
                          Message
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))
              )}
            </ListGroup>
          </Card>
        </Col>

        <Col md={8}>
              {selectedConversation ? (
                <Card className="shadow-sm" style={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
              <Card.Header>
                <strong>
                  {Object.keys(selectedConversation.participantDetails || {})
                    .filter(id => id !== user.uid)
                    .map(id => selectedConversation.participantDetails[id]?.name || 'Conversation')}
                </strong>
              </Card.Header>
              <Card.Body style={{ flex: 1, overflowY: 'auto' }}>
                {messages.length === 0 ? (
                  <div className="text-center text-muted py-5">
                    No messages yet. Say hello to get started.
                  </div>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      className={msg.senderId === user.uid ? 'message-sent' : 'message-received'}
                    >
                      <div>{msg.content}</div>
                      <small className="text-muted">
                        {(msg.createdAt?.toDate ? msg.createdAt.toDate() : (msg.createdAt ? new Date(msg.createdAt) : null))?.toLocaleTimeString() || ''}
                      </small>
                    </div>
                  ))
                )}
              </Card.Body>
              <Card.Footer>
                <Form onSubmit={handleSendMessage}>
                  <div className="d-flex align-items-start">
                    <div className="flex-grow-1 me-2">
                      <Form.Control
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        isInvalid={!!formErrors.content}
                      />
                      <Form.Control.Feedback type="invalid">
                        {formErrors.content}
                      </Form.Control.Feedback>
                    </div>
                    <Button variant="success" type="submit" disabled={isSendDisabled}>
                      <i className="bi bi-send"></i>
                    </Button>
                  </div>
                </Form>
              </Card.Footer>
            </Card>
          ) : (
            <Card className="shadow-sm text-center py-5">
              <Card.Body>
                <i className="bi bi-chat-text text-muted" style={{ fontSize: '3rem' }}></i>
                <h4 className="mt-3">Select a conversation</h4>
                <p className="text-muted">Choose a conversation to start messaging</p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default Messages;
