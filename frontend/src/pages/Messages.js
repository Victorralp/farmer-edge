import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, ListGroup, Form, Button } from 'react-bootstrap';
import { messagesAPI } from '../services/api';
import { toast } from 'react-toastify';

function Messages({ user }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const otherParticipant = selectedConversation.participants.find(
        p => p !== user.uid
      );

      await messagesAPI.send({
        recipientId: otherParticipant,
        conversationId: selectedConversation.id,
        content: newMessage,
      });

      setNewMessage('');
      fetchMessages(selectedConversation.id);
      fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-success"></div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <h1 className="mb-4">
        <i className="bi bi-chat-dots me-2"></i>
        Messages
      </h1>

      <Row>
        <Col md={4}>
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
                  const otherParticipant = Object.keys(conv.participantDetails).find(
                    id => id !== user.uid
                  );
                  const otherUser = conv.participantDetails[otherParticipant];

                  return (
                    <ListGroup.Item
                      key={conv.id}
                      action
                      active={selectedConversation?.id === conv.id}
                      onClick={() => handleConversationClick(conv)}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <strong>{otherUser?.name}</strong>
                          <p className="mb-0 text-muted small">{conv.lastMessage}</p>
                        </div>
                        <small className="text-muted">
                          {new Date(conv.lastMessageAt).toLocaleDateString()}
                        </small>
                      </div>
                    </ListGroup.Item>
                  );
                })
              )}
            </ListGroup>
          </Card>
        </Col>

        <Col md={8}>
          {selectedConversation ? (
            <Card className="shadow-sm" style={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
              <Card.Header>
                <strong>
                  {Object.keys(selectedConversation.participantDetails)
                    .filter(id => id !== user.uid)
                    .map(id => selectedConversation.participantDetails[id]?.name)}
                </strong>
              </Card.Header>
              <Card.Body style={{ flex: 1, overflowY: 'auto' }}>
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={msg.senderId === user.uid ? 'message-sent' : 'message-received'}
                  >
                    <div>{msg.content}</div>
                    <small className="text-muted">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </small>
                  </div>
                ))}
              </Card.Body>
              <Card.Footer>
                <Form onSubmit={handleSendMessage}>
                  <div className="d-flex">
                    <Form.Control
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="me-2"
                    />
                    <Button variant="success" type="submit">
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
