import axiosClient from "../api/axiosClient";

const gameService = {
  // Tạo phòng Cờ Carô Online
  createCaroRoom(userId, userName) {
    return axiosClient.post(`/games/caro/create?userId=${userId}&userName=${encodeURIComponent(userName)}`);
  },

  // Tham gia phòng
  joinCaroRoom(roomCode, userId, userName) {
    return axiosClient.post(`/games/caro/join?roomCode=${roomCode}&userId=${userId}&userName=${encodeURIComponent(userName)}`);
  },

  // Đặt cờ
  makeCaroMove(roomCode, userId, cellIndex) {
    return axiosClient.post(`/games/caro/move?roomCode=${roomCode}&userId=${userId}&cellIndex=${cellIndex}`);
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
