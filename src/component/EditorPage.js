import React , {useEffect, useRef , useState} from 'react'
import Client from './Client';
import Editor from './Editor';
import {toast} from 'react-hot-toast';
import {initiSocket} from "../Socket";
import { useNavigate , useLocation , useParams, Navigate } from 'react-router-dom';

function EditorPage() {
  const [clients, setClient] = useState([
  ]);
  const socketRef = useRef(null); // socket connection
  const codeRef = useRef(null); // code editor
  const location = useLocation();
  const { roomId } = useParams();
  const navigate = useNavigate();
  useEffect(() => {
    const init = async () => {
      socketRef.current = await initiSocket();
      socketRef.current.on('connect_error', (err) => handleError(err));
      socketRef.current.on('connect_failed', (err) => handleError(err));
      const handleError = (err) => {
        console.log('socket error =>', err);
        toast.error('Socket connection failed! Please refresh the page.');
        navigate('/');
      }
      socketRef.current.emit('join', {
        roomId,
        username: location.state?.username,
      });
      socketRef.current.on('joined', ({clients, username, socketId}) => {
        if(username !== location.state?.username){
          toast.success(`${username} joined the room`);
        }
        setClient(clients);
        socketRef.current.emit('sync-code', {
          code: codeRef.current,
          socketId,
        });
      });
      // disconnected
      socketRef.current.on('Left', ({socketId, username}) => {
        toast.success(`${username} left the room`);
        setClient((prev) => { 
        return prev.filter((client) => client.socketId !== socketId)});
      })
    };

    init();

    return () => {
      socketRef.current.disconnect();
      socketRef.current.off('joined');
      socketRef.current.off('Left');
    }
  }, []);
  if(!location.state){
    return <Navigate to = '/' />;
  }
  const copyRoomId = async () => {
    try{
      await navigator.clipboard.writeText(roomId);
      toast.success('Room id copied ');
    } catch (err){
      toast.error('Unable to copy room id');
    }
  }
  const leaveRoom = () => {
    navigate('/');
    toast.success('you have left the room');
  }
  return (
    <div className='container-fluid vh-100'>
      <div className='row h-100'>
        <div className='col-md-2 text-light d-flex flex-column h-100' style={{boxShadow: "2px 0px 4px rgba(0,0,0,0.1)"} }>
          <img src = "/images/logo.png" alt = "logo" className = "img-fluid mx-auto"
          style={{marginTop: "-40px", maxWidth: "100%"}}
          />
          <hr style={{ marginTop: "-3rem" }}/>
          {/* client list */}
          <div className = "d-flex flex-column overflow-auto">
            {clients.map((client) => (
              <Client key = {client.socketId} username = {client.username}/>
            ))}
          </div>
          <div className='mt-auto'>
            <hr></hr>
            <buttom onClick = {copyRoomId} className ="btn btn-primary btn-lg w-100">Copy Room Id</buttom>
            <buttom onClick = {leaveRoom} className ="btn btn-danger mt-3 mb-2 px-3 btn-block btn-lg w-100">Leave Room</buttom>
          </div>
        </div>
        {/* Editor */}
        <div className='col-md-10 text-light d-flex flex-column h-100'>
        <Editor socketRef = {socketRef} roomId = { roomId} onCodeChange = {(code) => codeRef.current = code} />
        </div>
      </div>
    </div>
  )
}

export default EditorPage;
