import axiosClient from "../api/axiosClient";

const gameService = {
  // Tạo phòng Cờ Carô Online
  createCaroRoom(_userId, userName) {
    return axiosClient.post(`/games/caro/create?userName=${encodeURIComponent(userName)}`);
  },

  // Tham gia phòng
  joinCaroRoom(roomCode, _userId, userName) {
    return axiosClient.post(`/games/caro/join?roomCode=${roomCode}&userName=${encodeURIComponent(userName)}`);
  },

  // Đặt cờ
  makeCaroMove(roomCode, _userId, cellIndex) {
    return axiosClient.post(`/games/caro/move?roomCode=${roomCode}&cellIndex=${cellIndex}`);
  },

  // Lấy trạng thái phòng (Polling status)
  getCaroRoom(roomCode) {
    return axiosClient.get(`/games/caro/room/${roomCode}`);
  },

  // Chơi lại ván mới
  restartCaroGame(roomCode) {
    return axiosClient.post(`/games/caro/restart?roomCode=${roomCode}`);
  },

  // Lấy danh sách các phòng đang chờ
  getOpenCaroRooms() {
    return axiosClient.get("/games/caro/open-rooms");
  }
};

export default gameService;
