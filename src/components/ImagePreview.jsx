import { useContext } from "react";
import { ImageContext } from "../context/ImageContext";

export default function ImagePreview() {
  const { image } = useContext(ImageContext);

  if (!image) return null;

  return (
    <div className="preview">
      <h3>Selected Image</h3>
      <img src={image} />
    </div>
  );
}