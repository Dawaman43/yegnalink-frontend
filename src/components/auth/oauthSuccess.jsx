import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const OAuthSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("token", token);
      navigate("/chat/home");
    } else {
      navigate("/login");
    }
  }, [navigate]);

  return <div className="text-center p-10"> Logging in with Google</div>;
};

export default OAuthSuccess;
