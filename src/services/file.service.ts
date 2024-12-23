/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuthStore } from "@/store";
import { IFile, IResponse } from "./types";
import axios from "axios";

class FileService {
  uploadDocument = async ({ setProgress, file, label }: { setProgress: any; file: File; label: string }): Promise<IResponse<IFile>> => {
    const url = `${import.meta.env.VITE_BASE_URL}/api/file`;
    const fmData = new FormData();
    fmData.append("file", file);
    fmData.append("label", label);
    const token = useAuthStore.getState().accessToken;
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", function (event) {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setProgress(Math.ceil(percentComplete));
        }
      });

      xhr.onload = function () {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.response) as any);
        }
        reject("Error occured during upload");
      };

      // Handle network errors
      xhr.onerror = function () {
        reject("Network error during upload");
        // Handle error
      };
      xhr.open("POST", url, true);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(fmData);
    });
  };

  deleteDocument = async (id: string) => {
    const token = useAuthStore.getState().accessToken;
    return new Promise((resolve, reject) => {
      axios
        .delete(`${import.meta.env.VITE_BASE_URL}/api/file/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        .then((data) => {
          resolve(data.data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  };

  updateDocument = async (
    id: string,
    payload: {
      setProgress: any;
      file: File;
      label: string;
    }
  ): Promise<IResponse<IFile>> => {
    const url = `${import.meta.env.VITE_BASE_URL}/api/file/${id}`;
    const fmData = new FormData();
    fmData.append("file", payload.file);
    fmData.append("label", payload.label);
    const token = useAuthStore.getState().accessToken;
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", function (event) {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          payload.setProgress(Math.ceil(percentComplete));
        }
      });

      xhr.onload = function () {
        resolve(JSON.parse(xhr.response) as any);
      };

      // Handle network errors
      xhr.onerror = function () {
        reject("Network error during upload");
        // Handle error
      };
      xhr.open("PATCH", url, true);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(fmData);
    });
  };
}

export default new FileService();
