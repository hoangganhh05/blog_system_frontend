import axiosClient from "../api/axiosClient";

const gameService = {
  // Tạo phòng Cờ Carô Online
  createCaroRoom(_userId, userName) {
    const name = userName || _userId || "Người chơi";
    return axiosClient.post(`/games/caro/create?userName=${encodeURIComponent(name)}`);
  },

  // Tham gia phòng
  joinCaroRoom(roomCode, _userId, userName) {
    const name = userName || _userId || "Người chơi";
    return axiosClient.post(`/games/caro/join?roomCode=${encodeURIComponent(roomCode)}&userName=${encodeURIComponent(name)}`);
  },

  // Đặt cờ
  makeCaroMove(roomCode, _userId, cellIndex) {
    const index = typeof cellIndex !== "undefined" ? cellIndex : _userId;
    return axiosClient.post(`/games/caro/move?roomCode=${encodeURIComponent(roomCode)}&cellIndex=${index}`);
  },

  // Lấy trạng thái phòng (Polling status)
  getCaroRoom(roomCode) {
    return axiosClient.get(`/games/caro/room/${encodeURIComponent(roomCode)}`);
  },

  // Chơi lại ván mới
  restartCaroGame(roomCode) {
    return axiosClient.post(`/games/caro/restart?roomCode=${encodeURIComponent(roomCode)}`);
  },

  // Lấy danh sách các phòng đang chờ
  getOpenCaroRooms() {
    return axiosClient.get("/games/caro/open-rooms");
  },
};

export const createCaroRoom = gameService.createCaroRoom.bind(gameService);
export const joinCaroRoom = gameService.joinCaroRoom.bind(gameService);
export const makeCaroMove = gameService.makeCaroMove.bind(gameService);
export const getCaroRoom = gameService.getCaroRoom.bind(gameService);
export const restartCaroGame = gameService.restartCaroGame.bind(gameService);
export const getOpenCaroRooms = gameService.getOpenCaroRooms.bind(gameService);

export default gameService;
