import React from "react";
import { useParams } from "react-router-dom";
import FreedomWall from "./FreedomWall";

export default function FreedomWallTagPage({ onOpenModal }) {
  const { tag } = useParams();
  return <FreedomWall onOpenModal={onOpenModal} view="tag" tag={tag} />;
}
