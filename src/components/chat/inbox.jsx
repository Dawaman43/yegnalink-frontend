import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/themeContext";
import axios from "axios";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { jwtDecode } from "jwt-decode";
import { io } from "socket.io-client";
import { images } from "../../constants/images";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSwipeable } from "react-swipeable";
import debounce from "lodash.debounce";
import gsap from "gsap";

const API_URL = import.meta.env.VITE_API_URL;

// Utility Functions
const isTokenExpired = (token) => {
  try {
    const decoded = jwtDecode(token);
    return decoded.exp < Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
};

const getUserIdFromToken = (token) => {
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    return decoded._id || null;
  } catch (error) {
    console.error("Token decode error:", error.message);
    return null;
  }
};

const normalizeImageUrl = (url) => {
  if (!url) return images.defaultProfile;
  if (url.startsWith("http")) return url;
  return `${API_URL}/${url.replace(/\\/g, "/")}`;
};

const Inbox = () => {
  const [profile, setProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [receiverId, setReceiverId] = useState(null);
  const [receiverName, setReceiverName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [lastMessages, setLastMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [profileModal, setProfileModal] = useState(null);
  const [imageModal, setImageModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [file, setFile] = useState(null);
  const [settingsMenu, setSettingsMenu] = useState(null);
  const [reactionMenu, setReactionMenu] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [messageDrafts, setMessageDrafts] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef({});
  const notificationSound = useRef(new Audio("/sounds/notification.mp3"));
  const socketRef = useRef(null);
  const sidebarRef = useRef(null);
  const userListRef = useRef(null);

  // Memoized userId
  const userId = useMemo(
    () => getUserIdFromToken(localStorage.getItem("token")),
    []
  );

  // Debounced search handler
  const debouncedSearch = useMemo(
    () =>
      debounce((query) => {
        setFilteredProfiles(
          profiles.filter((p) =>
            p.username?.toLowerCase().includes(query.toLowerCase())
          )
        );
      }, 300),
    [profiles]
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => debouncedSearch.cancel();
  }, [searchQuery, debouncedSearch]);

  // Load message drafts
  useEffect(() => {
    const savedDrafts = localStorage.getItem("messageDrafts");
    if (savedDrafts) setMessageDrafts(JSON.parse(savedDrafts));
  }, []);

  useEffect(() => {
    localStorage.setItem("messageDrafts", JSON.stringify(messageDrafts));
  }, [messageDrafts]);

  // Initialize socket
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (userId && token && !isTokenExpired(token)) {
      socketRef.current = io(API_URL, {
        query: { id: userId },
      });
      localStorage.setItem("userId", userId);
      socketRef.current.emit("joinRoom", { userId });
    } else {
      navigate("/login");
    }
    return () => socketRef.current?.disconnect();
  }, [userId, navigate]);

  // Sidebar animation
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (sidebar) {
      gsap.to(sidebar, {
        x: isSidebarOpen ? 0 : "-100%",
        duration: 0.2, // Faster animation for opening
        ease: "power2.out",
        onStart: () => {
          sidebar.style.display = isSidebarOpen ? "flex" : "none";
        },
        onComplete: () => {
          if (!isSidebarOpen) sidebar.style.display = "none";
        },
      });
    }
  }, [isSidebarOpen]);

  // User list animation
  useEffect(() => {
    if (profiles.length > 0) {
      gsap.fromTo(
        userListRef.current.children,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power3.out" }
      );
    }
  }, [profiles]);

  // Fetch user profile with retry logic
  const getUserData = useCallback(
    async (retries = 3) => {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token || isTokenExpired(token)) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { username, bio, profilePicture, email } =
          response.data.data || {};
        setProfile({
          username: username || "",
          bio: bio || "",
          profilePicture: normalizeImageUrl(profilePicture),
          email: email || "",
        });
      } catch (error) {
        if (retries > 0 && error.response?.status === 429) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return getUserData(retries - 1);
        }
        console.error(
          "Profile fetch error:",
          error.response?.data || error.message
        );
        if (error.response?.status === 404) {
          const decoded = jwtDecode(token);
          setProfile({
            username: decoded.username || "",
            bio: "",
            profilePicture: images.defaultProfile,
            email: decoded.email || "",
          });
        } else if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          navigate("/login");
        } else {
          setError("Failed to load profile. Please try again.");
          toast.error("Failed to load profile.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [userId, navigate]
  );

  // Fetch profiles
  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/profile/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profilesData = res.data.data
        .filter((p) => p.userId && p.username && p.userId !== userId)
        .map((p) => ({
          ...p,
          profilePicture: normalizeImageUrl(p.profilePicture),
        }));
      setProfiles(profilesData);
      setFilteredProfiles(profilesData);

      for (const profile of profilesData) {
        await Promise.all([
          fetchLastMessage(userId, profile.userId),
          fetchUnreadCount(userId, profile.userId),
        ]);
      }
    } catch (error) {
      console.error(
        "Profiles fetch error:",
        error.response?.data || error.message
      );
      setError("Failed to fetch contacts. Please refresh.");
      toast.error("Failed to fetch contacts.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId]);

  // Fetch last message
  const fetchLastMessage = async (senderId, receiverId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API_URL}/message/${senderId}/${receiverId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const messages = res.data.data;
      if (messages.length > 0) {
        setLastMessages((prev) => ({
          ...prev,
          [receiverId]: messages[messages.length - 1],
        }));
      }
    } catch (error) {
      console.error(
        `Error fetching messages for ${receiverId}:`,
        error.response?.data || error.message
      );
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async (senderId, receiverId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API_URL}/message/unread/${senderId}/${receiverId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUnreadCounts((prev) => ({
        ...prev,
        [receiverId]: res.data.count || 0,
      }));
    } catch (error) {
      console.error(
        `Error fetching unread count for ${receiverId}:`,
        error.response?.data || error.message
      );
    }
  };

  // Fetch messages with pagination
  const fetchMessages = useCallback(
    async (pageNum = 1, append = false) => {
      if (!receiverId) return;
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${API_URL}/message/${userId}/${receiverId}?page=${pageNum}&limit=20`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const newMessages = res.data.data.map((msg) => ({
          ...msg,
          senderId: msg.senderId.toString(),
          receiverId: msg.receiverId.toString(),
        }));

        setMessages((prev) =>
          append ? [...newMessages, ...prev] : newMessages
        );
        setHasMoreMessages(newMessages.length === 20);
        newMessages.forEach((msg) => {
          if (msg.senderId === receiverId && !msg.status) {
            socketRef.current?.emit("messageRead", {
              messageId: msg.messageId,
              senderId: msg.senderId,
              receiverId: userId,
            });
          }
        });
        if (chatContainerRef.current && !append) {
          chatContainerRef.current.scrollTop =
            chatContainerRef.current.scrollHeight;
        }
        setUnreadCounts((prev) => ({ ...prev, [receiverId]: 0 }));
      } catch (error) {
        console.error("Messages error:", error.response?.data || error.message);
        setError("Failed to fetch messages. Please try again.");
        toast.error("Failed to fetch messages.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [receiverId, userId]
  );

  // Handle infinite scroll
  const handleScroll = useCallback(() => {
    if (
      chatContainerRef.current.scrollTop < 100 &&
      !isLoading &&
      hasMoreMessages
    ) {
      setPage((prev) => prev + 1);
      fetchMessages(page + 1, true);
    }
  }, [isLoading, hasMoreMessages, page, fetchMessages]);

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.addEventListener("scroll", handleScroll);
      return () => chatContainer.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  // Swipe to refresh
  const swipeHandlers = useSwipeable({
    onSwipedDown: () => {
      if (chatContainerRef.current.scrollTop === 0 && !isRefreshing) {
        setIsRefreshing(true);
        fetchMessages(1);
        fetchProfiles();
      }
    },
    delta: 50,
    trackTouch: true,
    trackMouse: false,
  });

  // File upload
  const handleFileUpload = useCallback(async () => {
    if (!file || !receiverId) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("profilePicture", file);
      const uploadRes = await axios.post(
        `${API_URL}/profile/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const attachment = uploadRes.data.url;
      socketRef.current?.emit("sendMessage", {
        content: "",
        senderId: userId,
        receiverId,
        attachments: [attachment],
        encryptedAesKey: "",
      });
      setFile(null);
      fileInputRef.current.value = null;
      toast.success("Attachment sent successfully!");
    } catch (error) {
      console.error(
        "File upload error:",
        error.response?.data || error.message
      );
      setError("Failed to upload attachment. Please try again.");
      toast.error("Upload failed.");
    } finally {
      setIsLoading(false);
    }
  }, [file, receiverId, userId]);

  // Add reaction
  const addReaction = (messageId, emoji) => {
    socketRef.current?.emit("addReaction", {
      messageId,
      userId,
      emoji,
      receiverId,
    });
    setReactionMenu(null);
    toast.success("Reaction added!", { autoClose: 2000 });
  };

  // Delete message
  const deleteMessage = async (messageId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/message/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages((prev) => prev.filter((msg) => msg.messageId !== messageId));
      socketRef.current?.emit("messageDeleted", { messageId, receiverId });
      toast.success("Message deleted!", { autoClose: 2000 });
    } catch (error) {
      console.error(
        "Delete message error:",
        error.response?.data || error.message
      );
      setError("Failed to delete message.");
      toast.error("Failed to delete message.");
    }
  };

  // Delete chat
  const deleteChat = async () => {
    if (!receiverId) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/message/chat/${userId}/${receiverId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages([]);
      setLastMessages((prev) => {
        const newLastMessages = { ...prev };
        delete newLastMessages[receiverId];
        return newLastMessages;
      });
      setUnreadCounts((prev) => ({ ...prev, [receiverId]: 0 }));
      socketRef.current?.emit("chatDeleted", {
        receiverId,
        senderId: userId,
      });
      setReceiverId(null);
      setReceiverName("");
      setSettingsMenu(null);
      toast.success("Chat deleted!", { autoClose: 2000 });
    } catch (error) {
      console.error(
        "Delete chat error:",
        error.response?.data || error.message
      );
      setError("Failed to delete chat.");
      toast.error("Failed to delete chat.");
    }
  };

  // Socket event handlers
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleReceiverMessage = (data) => {
      if (
        !messages.some((msg) => msg.messageId === data.messageId) &&
        (data.senderId === userId || data.receiverId === userId)
      ) {
        setMessages((prev) => [
          ...prev,
          {
            ...data,
            senderId: data.senderId.toString(),
            receiverId: data.receiverId.toString(),
          },
        ]);
        setLastMessages((prev) => ({
          ...prev,
          [data.senderId]: {
            ...data,
            senderId: data.senderId.toString(),
            receiverId: data.receiverId.toString(),
          },
        }));
        if (data.senderId !== receiverId && data.senderId !== userId) {
          setNotifications((prev) => [
            ...prev,
            {
              userId: data.senderId,
              content: data.content || "New attachment",
              id: data.messageId,
            },
          ]);
          setUnreadCounts((prev) => ({
            ...prev,
            [data.senderId]: (prev[data.senderId] || 0) + 1,
          }));
          notificationSound.current.play().catch(() => {});
          toast.info(
            `New message from ${
              profiles.find((p) => p.userId === data.senderId)?.username ||
              "User"
            }`,
            { autoClose: 3000 }
          );
          setTimeout(() => {
            setNotifications((prev) =>
              prev.filter((n) => n.id !== data.messageId)
            );
          }, 5000);
        }
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop =
            chatContainerRef.current.scrollHeight;
        }
      }
    };

    socket.on("receiverMessage", handleReceiverMessage);
    socket.on("messageStatus", (response) => {
      if (!response.success) {
        setError(response.message || "Failed to send message.");
        toast.error(response.message || "Failed to send message.");
      } else {
        toast.success("Message sent!", { autoClose: 2000 });
      }
    });
    socket.on("typing", ({ userId: typingUserId }) => {
      setIsTyping((prev) => ({ ...prev, [typingUserId]: true }));
      clearTimeout(typingTimeoutRef.current[typingUserId]);
      typingTimeoutRef.current[typingUserId] = setTimeout(() => {
        setIsTyping((prev) => ({ ...prev, [typingUserId]: false }));
      }, 3000);
    });
    socket.on("messageRead", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.messageId === messageId ? { ...msg, status: true } : msg
        )
      );
      setUnreadCounts((prev) => ({ ...prev, [receiverId]: 0 }));
    });
    socket.on("reactionAdded", (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.messageId === data.messageId
            ? { ...msg, reactions: data.reactions }
            : msg
        )
      );
    });
    socket.on("messageDeleted", ({ messageId }) => {
      setMessages((prev) => prev.filter((msg) => msg.messageId !== messageId));
    });
    socket.on("chatDeleted", ({ senderId }) => {
      if (senderId === receiverId) {
        setMessages([]);
        setReceiverId(null);
        setReceiverName("");
      }
      setLastMessages((prev) => {
        const newLastMessages = { ...prev };
        delete newLastMessages[senderId];
        return newLastMessages;
      });
      setUnreadCounts((prev) => ({ ...prev, [senderId]: 0 }));
    });
    socket.on("userOnline", ({ userId: onlineUserId }) => {
      setOnlineUsers((prev) => new Set([...prev, onlineUserId]));
    });
    socket.on("userOffline", ({ userId: offlineUserId }) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(offlineUserId);
        return newSet;
      });
    });
    socket.on("connectionError", ({ message }) => {
      setError("Failed to connect to chat server. Retrying...");
      toast.error("Chat server connection failed.");
      setTimeout(() => socketRef.current?.connect(), 3000);
    });

    return () => {
      socket.off("receiverMessage", handleReceiverMessage);
      socket.off("messageStatus");
      socket.off("typing");
      socket.off("messageRead");
      socket.off("reactionAdded");
      socket.off("messageDeleted");
      socket.off("chatDeleted");
      socket.off("userOnline");
      socket.off("userOffline");
      socket.off("connectionError");
      const timeouts = { ...typingTimeoutRef.current };
      Object.values(timeouts).forEach(clearTimeout);
    };
  }, [receiverId, userId, profiles, messages]);

  // Initial data fetch
  useEffect(() => {
    getUserData();
    fetchProfiles();
  }, [getUserData, fetchProfiles]);

  useEffect(() => {
    if (receiverId) {
      fetchMessages(1);
      setMessage(messageDrafts[receiverId] || "");
    } else {
      setMessages([]);
    }
  }, [receiverId, messageDrafts, fetchMessages]);

  // Handlers
  const handleSend = useCallback(() => {
    if (!message.trim() && !file) return;
    if (file) {
      handleFileUpload();
    } else {
      socketRef.current?.emit("sendMessage", {
        content: message,
        senderId: userId,
        receiverId,
        attachments: [],
        encryptedAesKey: "",
      });
      setMessage("");
      setMessageDrafts((prev) => ({ ...prev, [receiverId]: "" }));
    }
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [message, file, userId, receiverId, handleFileUpload]);

  const handleTyping = useCallback(
    (e) => {
      setMessage(e.target.value);
      setMessageDrafts((prev) => ({ ...prev, [receiverId]: e.target.value }));
      if (receiverId) {
        socketRef.current?.emit("typing", {
          userId,
          receiverId,
        });
      }
    },
    [receiverId, userId]
  );

  const selectChat = useCallback(
    (chatUserId, username) => {
      setReceiverId(chatUserId);
      setReceiverName(username);
      setNotifications((prev) => prev.filter((n) => n.userId !== chatUserId));
      setMessageSearch("");
      setSettingsMenu(null);
      setReactionMenu(null);
      setMessage(messageDrafts[chatUserId] || "");
      setIsSidebarOpen(false);
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
      }
    },
    [messageDrafts]
  );

  const backToChats = useCallback(() => {
    setReceiverId(null);
    setReceiverName("");
    setMessages([]);
    setMessageSearch("");
    setSettingsMenu(null);
    setReactionMenu(null);
    setMessage("");
    setIsSidebarOpen(false);
  }, []);

  const openProfileModal = useCallback((profile) => {
    setProfileModal(profile);
    setSettingsMenu(null);
    setReactionMenu(null);
    gsap.fromTo(
      ".profile-modal",
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
    );
  }, []);

  const closeProfileModal = useCallback(() => {
    gsap.to(".profile-modal", {
      scale: 0.8,
      opacity: 0,
      duration: 0.3,
      ease: "back.in(1.7)",
      onComplete: () => setProfileModal(null),
    });
  }, []);

  const openImageModal = useCallback((url) => {
    setImageModal(url);
    setSettingsMenu(null);
    setReactionMenu(null);
    gsap.fromTo(
      ".image-modal",
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
    );
  }, []);

  const closeImageModal = useCallback(() => {
    gsap.to(".image-modal", {
      scale: 0.8,
      opacity: 0,
      duration: 0.3,
      ease: "back.in(1.7)",
      onComplete: () => setImageModal(null),
    });
  }, []);

  const formatTimestamp = (date) => {
    const d = new Date(date);
    const today = new Date();
    if (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    ) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const getDateSeparator = (currentDate, prevDate) => {
    if (!prevDate) return true;
    const curr = new Date(currentDate).toDateString();
    const prev = new Date(prevDate).toDateString();
    return curr !== prev;
  };

  const isSameSenderAsPrevious = (currentMsg, prevMsg) => {
    if (!prevMsg) return false;
    return (
      currentMsg.senderId === prevMsg.senderId &&
      new Date(currentMsg.createdAt) - new Date(prevMsg.createdAt) < 60000
    );
  };

  const truncateMessage = (content, maxLength = 20) => {
    if (!content) return "";
    return content.length > maxLength
      ? `${content.substring(0, maxLength)}...`
      : content;
  };

  // Handle sidebar toggle
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => {
      const newState = !prev;
      if (newState) {
        sidebarRef.current.style.display = "flex"; // Ensure sidebar is visible before animating
      }
      return newState;
    });
  }, []);

  // Loading Skeleton Component
  const LoadingSkeleton = ({ count }) => (
    <div className="space-y-2">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className={`flex items-center p-3 rounded-lg ${
            isDarkMode ? "bg-gray-700" : "bg-gray-200"
          } animate-pulse`}
        >
          <div className="w-12 h-12 rounded-full bg-gray-600"></div>
          <div className="ml-3 flex-1">
            <div className="h-4 w-3/4 bg-gray-600 rounded mb-2"></div>
            <div className="h-3 w-1/2 bg-gray-600 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? "bg-gray-900" : "bg-gray-100"
      } flex flex-col font-sans transition-colors duration-300`}
      aria-live="polite"
    >
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDarkMode ? "dark" : "light"}
      />
      <header
        className={`flex items-center justify-between p-4 ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        } shadow-md`}
        role="banner"
      >
        <div className="flex items-center space-x-3">
          <button
            className="sm:hidden p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onClick={toggleSidebar}
            aria-label="Open sidebar"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 5h14v2H3V5zm0 4h14v2H3V9zm0 4h14v2H3v-2z" />
            </svg>
          </button>
          <img
            src={profile?.profilePicture}
            alt={`Profile picture of ${profile?.username}`}
            className="w-10 h-10 rounded-full object-cover border-2 border-indigo-300 cursor-pointer"
            onError={(e) => (e.target.src = images.defaultProfile)}
            onClick={() => profile && openProfileModal(profile)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              e.key === "Enter" && profile && openProfileModal(profile)
            }
          />
          <h1
            className={`text-xl font-bold ${
              isDarkMode ? "text-white" : "text-indigo-600"
            }`}
          >
            Messenger
          </h1>
        </div>
      </header>

      {error && (
        <div
          className={`mx-4 mt-4 p-3 rounded-lg text-sm ${
            isDarkMode ? "bg-red-900 text-red-200" : "bg-red-100 text-red-800"
          } animate-slide-in flex justify-between items-center`}
          role="alert"
        >
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-sm underline focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col sm:flex-row mx-auto w-full max-w-7xl mt-4 gap-4 px-4">
        <div
          ref={sidebarRef}
          className={`fixed sm:static inset-y-0 left-0 z-40 w-64 flex flex-col ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          } rounded-xl sm:rounded-none shadow-md sm:shadow-none p-4 hidden sm:flex`} // Hidden on mobile by default
          role="navigation"
          aria-label="Sidebar navigation"
        >
          <div className="flex justify-between items-center mb-4 sm:hidden">
            <h2
              className={`text-lg font-semibold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Menu
            </h2>
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M6 6l8 8m0-8l-8 8"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </button>
          </div>
          <nav className="flex flex-col space-y-2">
            <button
              onClick={() => navigate("/chat/home")}
              className={`flex items-center p-3 rounded-lg ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-50 hover:bg-gray-100 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              aria-label="Navigate to home"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 2L2 8v10h16V8l-8-6zm0 2.5l6 4.5v8h-4v-4h-4v4H4v-8l6-4.5z" />
              </svg>
              Home
            </button>
            <button
              onClick={() => navigate("/chat/settings")}
              className={`flex items-center p-3 rounded-lg ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-50 hover:bg-gray-100 text-gray-900"
              } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              aria-label="Navigate to settings"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 8a2 2 0 100 4 2 2 0 000-4zm0 6a4 4 0 110-8 4 4 0 010 8zm0-14a9 9 0 00-9 9h2a7 7 0 1114 0h2a9 9 0 00-9-9z" />
              </svg>
              Settings
            </button>
          </nav>
          {receiverId && (
            <div className="mt-4">
              <h3
                className={`text-sm font-semibold mb-2 ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Chat Profile
              </h3>
              <div
                className={`p-3 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={
                      profiles.find((p) => p.userId === receiverId)
                        ?.profilePicture || images.defaultProfile
                    }
                    alt={`Profile picture of ${receiverName}`}
                    className="w-12 h-12 rounded-full object-cover border-2 border-indigo-300 cursor-pointer"
                    onError={(e) => (e.target.src = images.defaultProfile)}
                    onClick={() =>
                      openProfileModal(
                        profiles.find((p) => p.userId === receiverId)
                      )
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      openProfileModal(
                        profiles.find((p) => p.userId === receiverId)
                      )
                    }
                  />
                  <div>
                    <p
                      className={`font-semibold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {receiverName}
                    </p>
                    <p
                      className={`text-xs ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {profiles.find((p) => p.userId === receiverId)?.bio ||
                        "No bio"}
                    </p>
                    {onlineUsers.has(receiverId) && (
                      <p className="text-xs text-green-500">Online</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 sm:hidden"
            onClick={toggleSidebar}
            aria-hidden="true"
          ></div>
        )}

        <div
          className={`flex-1 rounded-xl shadow-md flex flex-col ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          } transition-colors duration-200`}
          role="main"
          {...swipeHandlers}
        >
          {!receiverId ? (
            <div className="flex-1 flex flex-col p-4">
              <div className="mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className={`w-full p-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${
                    isDarkMode
                      ? "bg-gray-700 text-white border-gray-600"
                      : "bg-gray-50 text-gray-900 border-gray-300"
                  }`}
                  aria-label="Search users"
                />
              </div>
              <div
                ref={userListRef}
                className="flex-1 overflow-y-auto space-y-2"
              >
                {isLoading ? (
                  <LoadingSkeleton count={5} />
                ) : filteredProfiles.length > 0 ? (
                  filteredProfiles.map((p) => (
                    <div
                      key={p.userId}
                      className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        isDarkMode
                          ? "bg-gray-700 hover:bg-gray-600 text-white"
                          : "bg-gray-50 hover:bg-gray-100 text-gray-900"
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                      onClick={() => selectChat(p.userId, p.username)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        openProfileModal(p);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) =>
                        e.key === "Enter" && selectChat(p.userId, p.username)
                      }
                      aria-label={`Chat with ${p.username}`}
                    >
                      <div className="relative">
                        <img
                          src={p.profilePicture}
                          alt={`Profile picture of ${p.username}`}
                          className="w-12 h-12 rounded-full object-cover border-2 border-indigo-300"
                          onError={(e) =>
                            (e.target.src = images.defaultProfile)
                          }
                        />
                        {onlineUsers.has(p.userId) && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 ml-3">
                        <p className="font-semibold text-sm truncate">
                          {p.username}
                        </p>
                        <p
                          className={`text-xs truncate ${
                            isTyping[p.userId]
                              ? isDarkMode
                                ? "text-indigo-400 italic"
                                : "text-indigo-600 italic"
                              : isDarkMode
                              ? "text-gray-400"
                              : "text-gray-500"
                          }`}
                        >
                          {isTyping[p.userId]
                            ? "Typing..."
                            : truncateMessage(
                                lastMessages[p.userId]?.content
                              ) ||
                              (lastMessages[p.userId]?.attachments?.length > 0
                                ? "Attachment"
                                : "No messages")}
                        </p>
                      </div>
                      {(unreadCounts[p.userId] || 0) > 0 && (
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-full ${
                            isDarkMode
                              ? "bg-blue-500 text-white"
                              : "bg-blue-600 text-white"
                          }`}
                        >
                          {unreadCounts[p.userId]}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p
                    className={`text-sm text-center ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    No users found.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div
                className={`flex items-center justify-between p-3 border-b ${
                  isDarkMode ? "border-gray-700" : "border-gray-200"
                }`}
                role="region"
                aria-label="Chat header"
              >
                <div className="flex items-center space-x-3">
                  <button
                    onClick={backToChats}
                    className={`p-2 rounded-full ${
                      isDarkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                    } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    aria-label="Back to chats"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <img
                    src={
                      profiles.find((p) => p.userId === receiverId)
                        ?.profilePicture || images.defaultProfile
                    }
                    alt={`Profile picture of ${receiverName}`}
                    className="w-10 h-10 rounded-full object-cover border-2 border-indigo-300 cursor-pointer"
                    onError={(e) => (e.target.src = images.defaultProfile)}
                    onClick={() =>
                      openProfileModal(
                        profiles.find((p) => p.userId === receiverId)
                      )
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      openProfileModal(
                        profiles.find((p) => p.userId === receiverId)
                      )
                    }
                  />
                  <div>
                    <h2
                      className={`text-lg font-semibold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {receiverName}
                    </h2>
                    {onlineUsers.has(receiverId) && (
                      <p className="text-xs text-green-500">Online</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={messageSearch}
                    onChange={(e) => setMessageSearch(e.target.value)}
                    placeholder="Search messages..."
                    className={`p-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${
                      isDarkMode
                        ? "bg-gray-700 text-white border-gray-600"
                        : "bg-gray-50 text-gray-900 border-gray-300"
                    }`}
                    aria-label="Search messages"
                  />
                  <button
                    onClick={() =>
                      setSettingsMenu((prev) => (prev ? null : {}))
                    }
                    className={`p-2 rounded-full ${
                      isDarkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                    } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    aria-label="Chat settings"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 8a2 2 0 100 4 2 2 0 000-4zm0 6a4 4 0 110-8 4 4 0 010 8zm0-14a9 9 0 00-9 9h2a7 7 0 1114 0h2a9 9 0 00-9-9z" />
                    </svg>
                  </button>
                  {settingsMenu && (
                    <div
                      className={`absolute top-16 right-4 ${
                        isDarkMode ? "bg-gray-700" : "bg-white"
                      } rounded-lg shadow-lg p-2 z-10`}
                      role="menu"
                    >
                      <button
                        onClick={deleteChat}
                        className={`w-full text-left px-4 py-2 text-sm ${
                          isDarkMode
                            ? "text-blue-400 hover:bg-gray-600"
                            : "text-blue-600 hover:bg-gray-100"
                        } rounded focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                        role="menuitem"
                        aria-label="Delete chat"
                      >
                        Delete Chat
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-1 relative"
                role="region"
                aria-label="Chat messages"
              >
                {isRefreshing && (
                  <div className="flex justify-center mb-2">
                    <div
                      className={`animate-spin h-6 w-6 border-4 border-t-transparent rounded-full ${
                        isDarkMode ? "border-indigo-400" : "border-blue-600"
                      }`}
                      aria-label="Refreshing messages"
                    ></div>
                  </div>
                )}
                {isLoading ? (
                  <LoadingSkeleton count={3} />
                ) : messages.length === 0 ? (
                  <p
                    className={`text-center text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    No messages found.
                  </p>
                ) : (
                  messages
                    .filter((msg) =>
                      messageSearch
                        ? msg.content
                            ?.toLowerCase()
                            .includes(messageSearch.toLowerCase())
                        : true
                    )
                    .map((msg, index, arr) => (
                      <div key={msg.messageId || index}>
                        {getDateSeparator(
                          msg.createdAt,
                          arr[index - 1]?.createdAt
                        ) && (
                          <div className="flex justify-center my-2">
                            <span
                              className={`text-xs px-3 py-1 rounded-full ${
                                isDarkMode
                                  ? "bg-gray-600 text-gray-300"
                                  : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              {new Date(msg.createdAt).toDateString()}
                            </span>
                          </div>
                        )}
                        <div
                          className={`flex ${
                            msg.senderId === userId
                              ? "justify-end"
                              : "justify-start"
                          } group relative ${
                            !isSameSenderAsPrevious(msg, arr[index - 1])
                              ? "mt-4"
                              : "mt-1"
                          } animate-message-in`}
                        >
                          {!isSameSenderAsPrevious(msg, arr[index - 1]) &&
                            msg.senderId !== userId && (
                              <img
                                src={
                                  profiles.find(
                                    (p) => p.userId === msg.senderId
                                  )?.profilePicture || images.defaultProfile
                                }
                                alt={`Profile picture of sender`}
                                className="w-8 h-8 rounded-full object-cover mr-2"
                                onError={(e) =>
                                  (e.target.src = images.defaultProfile)
                                }
                              />
                            )}
                          <div
                            className={`max-w-[70%] p-3 rounded-lg relative ${
                              msg.senderId === userId
                                ? isDarkMode
                                  ? "bg-blue-600 text-white"
                                  : "bg-blue-500 text-white"
                                : isDarkMode
                                ? "bg-gray-600 text-white"
                                : "bg-gray-100 text-gray-900"
                            } ${
                              isSameSenderAsPrevious(msg, arr[index - 1])
                                ? msg.senderId === userId
                                  ? "rounded-tr-sm"
                                  : "rounded-tl-sm"
                                : ""
                            }`}
                          >
                            {msg.content && <p>{msg.content}</p>}
                            {msg.attachments?.map((url, i) => (
                              <img
                                key={i}
                                src={normalizeImageUrl(url)}
                                alt={`Attachment ${i + 1}`}
                                className="max-w-full rounded cursor-pointer mt-2"
                                onClick={() =>
                                  openImageModal(normalizeImageUrl(url))
                                }
                                onError={(e) =>
                                  (e.target.src = images.defaultProfile)
                                }
                              />
                            ))}
                            <div className="flex items-center justify-between mt-1 space-x-1">
                              <p
                                className={`text-xs ${
                                  msg.senderId === userId
                                    ? "text-blue-200"
                                    : isDarkMode
                                    ? "text-gray-400"
                                    : "text-gray-500"
                                }`}
                              >
                                {formatTimestamp(msg.createdAt)}
                              </p>
                              {msg.senderId === userId && (
                                <span
                                  className={`text-xs transition-transform duration-300 ${
                                    isDarkMode
                                      ? "text-green-300 scale-110"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {msg.status ? "✔✔" : "✔"}
                                </span>
                              )}
                            </div>
                            {msg.reactions?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2 bg-gray-200/50 rounded-full px-2 py-1">
                                {msg.reactions.map((r, index) => (
                                  <span
                                    key={index}
                                    className="text-sm cursor-pointer hover:scale-125 transition-transform"
                                    title={`Reacted by ${r.userId}`}
                                  >
                                    {r.emoji}
                                  </span>
                                ))}
                              </div>
                            )}
                            <button
                              onClick={() =>
                                setReactionMenu(
                                  reactionMenu === msg.messageId
                                    ? null
                                    : msg.messageId
                                )
                              }
                              className="absolute top-0 right-2 px-1 py-2 text-gray-400 hover:text-white transition-colors hidden group-hover:block focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              aria-label="Toggle reactions"
                            >
                              😊
                            </button>
                            {reactionMenu === msg.messageId && (
                              <div
                                className={`absolute top-6 right-0 ${
                                  isDarkMode ? "bg-gray-700" : "bg-white"
                                } rounded-lg shadow-lg p-2 z-10 flex space-x-2`}
                              >
                                {["😊", "😍", "👍", "🔥", "😢"].map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() =>
                                      addReaction(msg.messageId, emoji)
                                    }
                                    className="text-lg hover:scale-125 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    aria-label={`Add ${emoji} reaction`}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                                {msg.senderId === userId && (
                                  <button
                                    onClick={() => deleteMessage(msg.messageId)}
                                    className="text-lg hover:scale-125 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    aria-label="Delete message"
                                  >
                                    🗑️
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                )}
                {isTyping[receiverId] && (
                  <div className="flex justify-start">
                    <div
                      className={`p-1 text-sm italic ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      } animate-pulse bg-gray-800/50 rounded-full px-4 py-1 flex items-center space-x-1`}
                    >
                      <span>{receiverName} is typing</span>
                      <span className="animate-bounce">...</span>
                      <span className="animate-bounce delay-100">.</span>
                      <span className="animate-bounce delay-200">.</span>
                    </div>
                  </div>
                )}
              </div>

              <div
                className={`flex items-center p-3 border-t ${
                  isDarkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => setFile(e.target.files[0])}
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  className={`p-2 rounded-full ${
                    isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  aria-label="Add file"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M5 10h4V6h4v4h4v2h-4v4H9v-4H5v-2z" />
                  </svg>
                </button>
                <input
                  type="text"
                  value={message}
                  onChange={handleTyping}
                  placeholder="Type a message..."
                  className={`flex-1 mx-2 rounded-full px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${
                    isDarkMode
                      ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                      : "bg-gray-100 text-gray-900 border-gray-300 placeholder-gray-600"
                  } transition-colors duration-300`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSend();
                    }
                  }}
                  aria-label="Type a message"
                />
                <button
                  onClick={handleSend}
                  className={`p-2 rounded-full ${
                    message.trim() || file
                      ? isDarkMode
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                      : "bg-gray-400 text-gray-800 cursor-not-allowed"
                  } transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                  disabled={!message.trim() && !file}
                  aria-label="Send message"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 19l9 2-9-18-9 18 9-2m0 0v-8"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {(profileModal || imageModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          {profileModal && (
            <div
              className={`w-full max-w-md rounded-lg shadow-lg p-6 profile-modal ${
                isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
              } transition-colors duration-300`}
            >
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Profile</h2>
                  <button
                    onClick={closeProfileModal}
                    className={`text-xl ${
                      isDarkMode
                        ? "text-gray-400 hover:text-gray-300"
                        : "text-gray-500 hover:text-gray-700"
                    } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    aria-label="Close profile"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && closeProfileModal()}
                  >
                    ×
                  </button>
                </div>
                <div className="flex items-center space-x-4 mb-4">
                  <img
                    src={profileModal.profilePicture}
                    alt={`Profile picture of ${profileModal.username}`}
                    className="w-16 h-16 rounded-full object-cover border-2 border-indigo-300 cursor-pointer"
                    onError={(e) => (e.target.src = images.defaultProfile)}
                    onClick={() => openImageModal(profileModal.profilePicture)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      openImageModal(profileModal.profilePicture)
                    }
                  />
                  <div>
                    <p className="font-semibold text-lg">
                      {profileModal.username}
                    </p>
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {profileModal.bio || "No bio available"}
                    </p>
                    {profileModal.email && (
                      <p
                        className={`text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {profileModal.email}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    selectChat(profileModal.userId, profileModal.username);
                    closeProfileModal();
                  }}
                  className={`w-full py-2 rounded-lg transition-colors duration-200 ${
                    isDarkMode
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                >
                  Start Chat
                </button>
              </div>
            </div>
          )}
          {imageModal && (
            <div className="relative w-full max-w-3xl mx-auto image-modal">
              <button
                onClick={closeImageModal}
                className="absolute top-2 right-2 text-white bg-gray-800 rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Close image"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && closeImageModal()}
              >
                ×
              </button>
              <img
                src={imageModal}
                alt="Expanded image"
                className="w-full h-auto rounded-lg object-contain max-h-[80vh]"
                onError={(e) => (e.target.src = images.defaultProfile)}
              />
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes message-in {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        .animate-message-in { animation: message-in 0.5s ease-out; }
        .animate-bounce { animation: bounce 0.6s ease-in-out infinite; }
        .animate-pulse { animation: pulse 1.5s ease-in-out infinite; }
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
        @media (max-width: 640px) {
          .chat-container { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default Inbox;
