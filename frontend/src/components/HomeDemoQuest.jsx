import React, { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, ArrowDown } from "lucide-react";
import { startGame, stopGame } from "../utilities/engine/main";
import HomeDemoTerminal from "./HomeDemoTerminal";
import styles from "../styles/HomeDemoQuest.module.css";
import pythonQuests from "../utilities/data/pythonExercises.json";

const DEMO_QUEST_ID = 2;

function getDemoQuest() {
  if (!Array.isArray(pythonQuests)) return null;
  const q = pythonQuests.find((x) => Number(x?.id) === DEMO_QUEST_ID) || null;
  if (!q) return null;

  // Normalize fields used by engine / terminal layers.
  return {
    ...q,
    id: Number(q.id),
    order_index: Number(q.order_index ?? q.id),
    expectedOutput: q.expectedOutput ?? q.expected_output ?? "Hello World!",
    startingCode: q.startingCode ?? q.starting_code ?? "print()",
  };
}

export default function HomeDemoQuest() {
  const sectionRef = useRef(null);
  const gameWrapRef = useRef(null);
  const [armed, setArmed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const quest = useMemo(() => getDemoQuest(), []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const any = entries.some((e) => e.isIntersecting);
        if (any) {
          setArmed(true);
          io.disconnect();
        }
      },
      { root: null, threshold: 0.1, rootMargin: "200px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!armed) return;
    if (!quest) return;
    const parentId = "home-phaser-container";

    // Ensure the container exists in DOM before starting.
    const container = document.getElementById(parentId);
    if (!container) return;

    startGame({
      exerciseId: DEMO_QUEST_ID,
      quest,
      parent: parentId,
      completedQuests: [],
    });
    setMounted(true);

    const onResize = () => {
      const g = window.game;
      const parent = document.getElementById(parentId);
      if (!g || !parent) return;
      const canvasParentId = g?.canvas?.parentElement?.id;
      if (canvasParentId !== parentId) return;

      const w = parent.clientWidth || 800;
      const h = parent.clientHeight || 520;
      try {
        g.scale?.resize?.(w, h);
      } catch {
        // ignore
      }
    };

    window.addEventListener("resize", onResize);
    onResize();

    return () => {
      window.removeEventListener("resize", onResize);

      // Only stop the singleton if it is still mounted in our container.
      const g = window.game;
      const canvasParentId = g?.canvas?.parentElement?.id;
      if (canvasParentId === parentId) {
        stopGame();
      }
    };
  }, [armed, quest]);

  const handleQuestComplete = () => {
    window.dispatchEvent(
      new CustomEvent("code-mania:quest-complete", {
        detail: { questId: DEMO_QUEST_ID },
      })
    );
  };

  return (
    <section id="home-demo-quest" ref={sectionRef} className={styles.demoSection}>
      <div className={styles.demoWrap}>
        <div className={styles.demoHeader}>
          <div className={styles.demoKicker}>
            <Sparkles size={16} />
            Play the demo
          </div>
          <h2 className={styles.demoTitle}>One-minute quest. Instant dopamine.</h2>
          <p className={styles.demoSub}>
            Move around, run the code, and complete your first quest. No sign-in needed.
          </p>
        </div>

        <div className={styles.demoGrid}>
          <div className={styles.demoGameCard} ref={gameWrapRef}>
            <div className={styles.demoGameTop}>
              <div className={styles.demoGameTopLeft}>
                <span className={styles.demoPill}>Quest</span>
                <span className={styles.demoQuestName}>{quest?.title || "Hello World"}</span>
              </div>
              <div className={styles.demoGameTopRight}>
                <span className={styles.demoHintPill}>
                  <ArrowDown size={14} />
                  Scroll / WASD
                </span>
              </div>
            </div>

            <div className={styles.demoGameViewport}>
              <div id="home-phaser-container" className={styles.demoPhaser} />
              {!mounted ? (
                <div className={styles.demoLoading}>
                  Loading demo world...
                </div>
              ) : null}
            </div>
          </div>

          <HomeDemoTerminal language="python" quest={quest} onQuestComplete={handleQuestComplete} />
        </div>
      </div>
    </section>
  );
}
