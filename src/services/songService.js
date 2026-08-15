import axiosClient from "../api/axiosClient";

const songService = {
  getAll() {
    return axiosClient.get("/songs");
  },

  search(query = "") {
    return axiosClient.get(`/songs/search?query=${encodeURIComponent(query)}`);
  },
};

export default songService;
