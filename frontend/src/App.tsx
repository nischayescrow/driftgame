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
        const singupRes = await axios.get(
          "http://localhost:5000/auth/signup/google",
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
          "http://localhost:5000/auth/login/google",
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
        "http://localhost:5000/auth/login/email",
        { email },
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
          store.socket.emit("lobby:friendRequest:accepted", {
            requestId: payload.requestId,
          });
        } else {
          store.socket.emit("lobby:friendRequest:rejected", {
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
        `http://localhost:5000/user/search?text=${search}&page=1&limit=10`,
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
      store.socket.emit("lobby:friendRequest:sent", {
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
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

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "16px",
          }}
        >
          <input
            type="text"
            style={{
              padding: "20px 5px",
              backgroundColor: "white",
              width: "300px",
              color: "black",
            }}
            ref={userRef}
          />
          <button
            type="button"
            style={{
              padding: "20px 10px",
              backgroundColor: "blue",
              color: "white",
            }}
            onClick={() => {
              if (userRef.current) oneTaplogin(userRef.current.value);
            }}
          >
            Email Login
          </button>
        </div>
        <div
          style={{
            display: "flex",
            gap: "16px",
          }}
        >
          <button
            type="button"
            style={{
              padding: "20px 10px",
              backgroundColor: "blue",
              color: "white",
            }}
            onClick={signup}
          >
            Sign up with Google
          </button>
          <button
            type="button"
            style={{
              padding: "20px 10px",
              backgroundColor: "blue",
              color: "white",
            }}
            onClick={login}
          >
            Sign in with Google
          </button>
        </div>
      </div>

      {isConnected && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Friends */}
          <div>
            <p>Friends</p>
            <ul
              style={{
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {store &&
                store.user &&
                store.user.friends.map((usr: any, inx: number) => (
                  <li
                    key={`user-${inx}`}
                    style={{
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        padding: "16px",
                        width: "100%",
                        backgroundColor: "white",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        color: "black",
                      }}
                    >
                      <p>{usr}</p>
                      <button
                        type="button"
                        style={{
                          padding: "20px 10px",
                          backgroundColor: "red",
                          color: "white",
                        }}
                        onClick={() => sendFriendReq(usr._id)}
                      >
                        Unfriend
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          </div>

          {/* Disconnected */}
          <div
            style={{
              display: "flex",
              gap: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "20px",
              }}
            >
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
              style={{
                padding: "20px 10px",
                backgroundColor: "red",
                color: "white",
              }}
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
              style={{
                padding: "20px 10px",
                backgroundColor: "white",
                width: "500px",
                color: "black",
              }}
            />

            <ul
              style={{
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {store &&
                store.users &&
                store.users.map((usr: any, inx: number) => (
                  <li key={`user-${inx}`}>
                    <div
                      style={{
                        padding: "16px",
                        backgroundColor: "white",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        color: "black",
                      }}
                    >
                      <p>
                        {usr.first_name} {usr.last_name}
                      </p>
                      <button
                        type="button"
                        style={{
                          padding: "20px 10px",
                          backgroundColor: "red",
                          color: "white",
                        }}
                        onClick={() => sendFriendReq(usr._id)}
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
