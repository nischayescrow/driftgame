import { useGoogleLogin } from "@react-oauth/google";
import "./App.css";
import axios from "axios";
import { Bounce, toast, ToastContainer } from "react-toastify";
import useSocket from "./hooks/useSocket";
import { useEffect, useRef, useState } from "react";

function App() {
  const store = useSocket();
  let playerStatusTick: any = useRef<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  // const [users, setUsers] = useState<any>([]);
  const userRef = useRef<HTMLInputElement | null>(null);

  const signup = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async (codeResponse) => {
      try {
        console.log(codeResponse);
        const singupRes = await axios.get(
          `${import.meta.env.VITE_APP_BACKEND_URL}/auth/signup/google`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: codeResponse.code,
            },
          },
        );

        console.log("singupRes: ", singupRes);

        if (singupRes.status === 201) {
          toast.success(singupRes.data.message);
        }
      } catch (error: any) {
        console.log(error);
        if (error.status === 400 && error.response && error.response.data) {
          toast.error(error.response.data.message);
        }
      }
    },
    onError: (error) => console.log("Sign up with google failed!!"),
  });

  const login = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async (codeResponse) => {
      try {
        console.log(codeResponse);
        const loginRes = await axios.get(
          `${import.meta.env.VITE_APP_BACKEND_URL}/auth/login/google`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: codeResponse.code,
            },
            timeout: 10000,
          },
        );

        console.log("Google-login:", loginRes.data);

        if (loginRes.status === 200 && loginRes.data) {
          toast.success(loginRes.data.message);
          store.setToken(loginRes.data.access_token);
        }
      } catch (error: any) {
        console.log(error);
        if (error.status === 400 && error.response && error.response.data) {
          toast.error(error.response.data.message);
        }
      }
    },
    onError: (error) => console.log("Sign in with google failed!!"),
  });

  const oneTaplogin = async (email: string) => {
    try {
      const loginRes = await axios.post(
        `${import.meta.env.VITE_APP_BACKEND_URL}/auth/login/email`,
        { email, password: "admin@2026" },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        },
      );

      if (loginRes.status === 200 && loginRes.data) {
        console.log("loginRes.data: ", loginRes.data);
        // toast.success(loginRes.data.message);
        store.setToken(loginRes.data.access_token);
        store.setUser(loginRes.data.user);
      }
    } catch (error: any) {
      console.log(error);
      if (error.status === 400 && error.response && error.response.data) {
        toast.error(error.response.data.message);
      }
    }
  };

  useEffect(() => {
    if (store && store.token && store.socket) {
      store.socket.connect();

      setIsConnected(true);

      store.socket.on("message", (payload: any) => {
        console.log("message:payload", payload);
        toast.info(payload.message);
      });

      store.socket.on("player:logout", (payload: any) => {
        store.setSocket(null);
        store.setToken(null);
        store.setUser(null);
        store.setUsers(null);
      });

      store.socket.on("friend-req", (payload: any) => {
        console.log("friend-req: ", payload);
        if (confirm(payload.message)) {
          store.socket.emit("friend:request:accept", {
            requestId: payload.requestId,
          });
        } else {
          store.socket.emit("friend:request:reject", {
            requestId: payload.requestId,
          });
        }
      });
    }

    return () => {
      if (store.socket) {
        store.socket.disconnect();
        setIsConnected(false);
      }
    };
  }, [store.socket]);

  const fetchUsers = async (search: string) => {
    try {
      const userSearchRes = await axios.get(
        `${import.meta.env.VITE_APP_BACKEND_URL}/user/search?text=${search}&page=1&limit=10`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${store.token}`,
          },
          timeout: 10000,
        },
      );

      if (userSearchRes.status === 200) {
        console.log("Users: ", userSearchRes.data);
        store.setUsers(userSearchRes.data.data);
      }
    } catch (error: any) {
      console.log(error);
      if (error.status === 400 && error.response && error.response.data) {
        toast.error(error.response.data.message);
      }
    }
  };

  const sendFriendReq = (user_id: string) => {
    console.log("user_id: ", user_id);

    if (store.socket) {
      store.socket.emit("friend:request:send", {
        sender_id: store.user.id,
        receiver_id: user_id,
      });
    }
  };

  // Player status tick
  useEffect(() => {
    if (store && store.token && store.socket) {
      playerStatusTick.current = setInterval(() => {
        store.socket.emit("player:connected");
      }, 5000);
    }

    return () => {
      if (playerStatusTick.current) clearInterval(playerStatusTick.current);
    };
  }, [store.socket]);

  return (
    <div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable={false}
        pauseOnHover
        theme="light"
        transition={Bounce}
      />

      <div>
        <div>
          <input type="text" autoComplete="email" ref={userRef} />
          <button
            type="button"
            onClick={() => {
              if (userRef.current) oneTaplogin(userRef.current.value);
            }}
          >
            Email Login
          </button>
        </div>
        <div>
          <button type="button" onClick={signup}>
            Sign up with Google
          </button>
          <button type="button" onClick={() => login()}>
            Sign in with Google
          </button>
        </div>
      </div>

      {isConnected && (
        <div>
          {/* Friends */}
          <div>
            <p>Friends</p>
            <ul>
              {store &&
                store.user &&
                store.user.friends.map((usr: any, inx: number) => (
                  <li key={`user-${inx}`}>
                    <div>
                      <div>
                        {usr.picture && (
                          <img src={usr.picture} alt="Friend Picture" />
                        )}
                        <div>
                          <p>
                            {usr.first_name}
                            {usr.last_name}
                          </p>

                          <p>{usr.email}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => sendFriendReq(usr.id)}
                      >
                        Unfriend
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          </div>

          {/* Disconnected */}
          <div>
            <div>
              <p className="text-white text-xl font-semibold">
                Socket Connected
              </p>
              <button
                type="button"
                style={{
                  padding: "20px 10px",
                  backgroundColor: "red",
                  color: "white",
                }}
                onClick={() => {
                  if (store.socket) {
                    store.socket.disconnect();
                    setIsConnected(false);

                    if (playerStatusTick.current)
                      clearInterval(playerStatusTick.current);
                  }
                }}
              >
                Disconnect
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                if (playerStatusTick.current)
                  clearInterval(playerStatusTick.current);
              }}
            >
              Stop Player:ticks
            </button>
          </div>

          {/* User search */}
          <div>
            <input
              type="text"
              onChange={(event) => fetchUsers(event.target.value)}
            />

            <ul>
              {store &&
                store.users &&
                store.users.map((usr: any, inx: number) => (
                  <li key={`user-${inx}`}>
                    <div>
                      <p>
                        {usr.first_name} {usr.last_name}
                      </p>
                      <button
                        type="button"
                        onClick={() => sendFriendReq(usr.id)}
                      >
                        Invite
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
