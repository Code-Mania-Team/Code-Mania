import React from "react";
import { useParams } from "react-router-dom";
import FreedomWall from "./FreedomWall";

export default function FreedomWallChannelPage({ onOpenModal }) {
  const { channelId } = useParams();
  return <FreedomWall onOpenModal={onOpenModal} view="channel" channelId={channelId} />;
}
