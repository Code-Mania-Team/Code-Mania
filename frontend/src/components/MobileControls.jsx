import React from "react";
import styles from "../styles/MobileControls.module.css";
const MobileControls = () => {
  const sendMove = (dx, dy) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("code-mania:mobile-move", {
        detail: { dx, dy },
      })
    );
  };
  const stopMove = () => sendMove(0, 0);
  const handleDirDown = (dx, dy) => (e) => {
    e.preventDefault();
    sendMove(dx, dy);
  };
  const handleDirUp = (e) => {
    e.preventDefault();
    stopMove();
  };
  const handleAction = (e) => {
    e.preventDefault();
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("code-mania:mobile-action", {
        detail: { action: "interact" },
      })
    );
  };
  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        aria-label="Move Up"
        className={`${styles.hit} ${styles.up}`}
        onPointerDown={handleDirDown(0, -1)}
        onPointerUp={handleDirUp}
        onPointerCancel={handleDirUp}
        onPointerLeave={handleDirUp}
      />
      <button
        type="button"
        aria-label="Move Left"
        className={`${styles.hit} ${styles.left}`}
        onPointerDown={handleDirDown(-1, 0)}
        onPointerUp={handleDirUp}
        onPointerCancel={handleDirUp}
        onPointerLeave={handleDirUp}
      />
      <button
        type="button"
        aria-label="Move Right"
        className={`${styles.hit} ${styles.right}`}
        onPointerDown={handleDirDown(1, 0)}
        onPointerUp={handleDirUp}
        onPointerCancel={handleDirUp}
        onPointerLeave={handleDirUp}
      />
      <button
        type="button"
        aria-label="Move Down"
        className={`${styles.hit} ${styles.down}`}
        onPointerDown={handleDirDown(0, 1)}
        onPointerUp={handleDirUp}
        onPointerCancel={handleDirUp}
        onPointerLeave={handleDirUp}
      />
      <button
        type="button"
        aria-label="Interact"
        className={`${styles.hit} ${styles.interact}`}
        onPointerDown={handleAction}
      />
    </div>
  );
};
export default MobileControls;
