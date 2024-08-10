'use client'
import { Box, Stack, Button, TextField, Modal, Typography } from "@mui/material";
import { useState, useEffect, useRef } from 'react';
import { keyframes } from '@emotion/react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

// Define the shake animation using keyframes
const shake = keyframes`
  0% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
  100% { transform: translateX(0); }
`;

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm the Headstarter support agent, how can I assist you today?`
    }
  ]);

  const [message, setMessage] = useState('');
  const [apiKey, setApiKey] = useState(''); // State to store the user's API key
  const [loadingDots, setLoadingDots] = useState('');
  const [open, setOpen] = useState(false); // Start with modal closed
  const [shakeButton, setShakeButton] = useState(false); // State to control the shake animation for the button
  const [shakeInput, setShakeInput] = useState(false); // State to control the shake animation for the input field
  const [apiKeyEntered, setApiKeyEntered] = useState(false); // Track if API key is entered
  const [apiKeyValid, setApiKeyValid] = useState(false); // Track if the API key is valid
  const [errorMessage, setErrorMessage] = useState(''); // Store any error messages
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let interval;
    if (loadingDots !== '') {
      interval = setInterval(() => {
        setLoadingDots(prev => prev.length < 3 ? prev + '.' : '');
      }, 100);
    }
    return () => clearInterval(interval);
  }, [loadingDots]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const validateApiKey = async () => {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error('Invalid API Key');
      }

      setApiKeyValid(true); // Mark the API key as valid
      setApiKeyEntered(true); // Mark the API key as entered
      setErrorMessage('');
      handleClose();
    } catch (error) {
      setApiKeyValid(false); // Mark the API key as invalid
      setErrorMessage('Invalid API Key. Please try again.');
    }
  };

  const handleApiKeySubmit = () => {
    if (apiKey.trim() === '') {
      setShakeButton(true);
      setTimeout(() => setShakeButton(false), 1000);
      return;
    }
    validateApiKey(); // Validate the API key on submission
  };

  const sendMessage = async () => {
    if (!apiKeyValid) {
      setShakeButton(true); // Trigger the shake animation for the button
      setTimeout(() => setShakeButton(false), 1000); // Stop the shake animation after 1 second
      return;
    }

    if (!message.trim()) {
      setShakeInput(true); // Trigger the shake animation for the input field
      setTimeout(() => setShakeInput(false), 1000); // Stop the shake animation after 1 second
      return;
    }

    setMessage('');
    setMessages((messages) => [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: '' },
    ]);
    setLoadingDots('.');

    const response = fetch('/api/chat', {
      method: "POST",
      headers:{
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messages: [...messages, { role: 'user', content: message }], apiKey })
    }).then(async (res) => {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let result = '';
      return reader.read().then(function processText({ done, value }) {
        if (done) {
          setLoadingDots(''); // Stop the loading dots when done
          return result;
        }
        const text = decoder.decode(value || new Int8Array(), { stream: true });
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            {
              ...lastMessage,
              content: lastMessage.content + text,
            },
          ];
        });
        return reader.read().then(processText);
      });
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Stack
        direction="column"
        width="600px"
        height="700px"
        border="1px solid black"
        p={2}
        spacing={2}
      >
        <Stack
          direction="column"
          spacing={2}
          flexGrow={1}
          overflow="auto"
          max="100%"
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display='flex'
              justifyContent={message.role === 'assistant' ? 'flex-start' : 'flex-end'}
            >
              <Box
                bgcolor={message.role === 'assistant' ? 'primary.main' : 'secondary.main'}
                color="white"
                borderRadius={7}
                p={3}
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {message.content || (message.role === 'assistant' ? loadingDots : '')}
              </Box>
            </Box>
          ))}
          {!apiKeyEntered && ( // Only show the button if API key hasn't been entered
            <Box display="flex" justifyContent="center" mt={2}>
              <Button
                variant="contained"
                onClick={handleOpen}
                sx={{
                  animation: shakeButton ? `${shake} 0.5s` : 'none',
                  bgcolor: shakeButton ? 'red' : 'secondary.main',
                  '&:hover': {
                    bgcolor: shakeButton ? 'red' : 'secondary.dark', // Darker purple on hover
                  },
                }}
              >
                To get started, enter your API key
              </Button>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            sx={{
              animation: shakeInput ? `${shake} 0.5s` : 'none',
              borderColor: shakeInput ? 'red' : 'primary.main',
              '& .MuiOutlinedInput-root.Mui-error .MuiOutlinedInput-notchedOutline': {
                borderColor: shakeInput ? 'red' : 'primary.main',
              },
            }}
            error={shakeInput && apiKeyValid} // Show error state when shaking and if API key is valid
          />
          <Button variant="contained" onClick={sendMessage}>Send</Button>
        </Stack>
      </Stack>

      {/* Modal for API Key Entry */}
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="api-key-modal-title"
        aria-describedby="api-key-modal-description"
      >
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          position="absolute"
          top="50%"
          left="50%"
          sx={{transform: "translate(-50%, -50%)"}}
          width={400}
          bgcolor="background.paper"
          border="2px solid #000"
          boxShadow={24}
          p={4}
        >
          <Box>
            <Typography id="api-key-modal-title" variant="h6" component="h2">
              Enter Your API Key
            </Typography>
            <TextField
              fullWidth
              label="API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoComplete="off"
              margin="normal"
              error={!!errorMessage} // Show error styling if there's an error
              helperText={errorMessage} // Show the error message if invalid
            />
            <Button variant="contained" color="primary" onClick={handleApiKeySubmit}>
              Submit
            </Button>
          </Box>
        </Box>
      </Modal>

      <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center' }}>
        {apiKeyValid ? (
          <>
            <CheckCircleIcon sx={{ color: 'green', mr: 1 }} />
            <Typography variant="body2" sx={{ color: 'green' }}>Online</Typography>
          </>
        ) : (
          <>
            <CancelIcon sx={{ color: 'red', mr: 1 }} />
            <Typography variant="body2" sx={{ color: 'red' }}>Offline</Typography>
          </>
        )}
      </Box>
    </Box>
  );
}
