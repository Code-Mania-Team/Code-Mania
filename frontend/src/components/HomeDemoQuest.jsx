import React, { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, ArrowDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { startGame, stopGame } from "../utilities/engine/main";
import HomeDemoTerminal from "./HomeDemoTerminal";
import styles from "../styles/HomeDemoQuest.module.css";

const DEMO_EXERCISE_ID = 99999;

function getDemoQuest() {
  return {
    id: DEMO_EXERCISE_ID,
    order_index: DEMO_EXERCISE_ID,
    title: "Welcome",
    description: "",
    task: "",
    lessonHeader: "",
    expectedOutput: "",
    startingCode: "",
    map_id: "demo_map",
    programming_languages: { slug: "python" },
  };
}

export default function HomeDemoQuest() {
  const sectionRef = useRef(null);
  const gameWrapRef = useRef(null);
  const [armed, setArmed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const [introCompleted, setIntroCompleted] = useState(false);
  const quest = useMemo(() => getDemoQuest(), []);
  const navigate = useNavigate();

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
      exerciseId: DEMO_EXERCISE_ID,
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

  useEffect(() => {
    const onIntro = () => {
      setIntroOpen(true);
    };
    window.addEventListener("code-mania:home-demo:intro", onIntro);
    return () => window.removeEventListener("code-mania:home-demo:intro", onIntro);
  }, []);

  useEffect(() => {
    if (!introCompleted) return;
    const t = window.setTimeout(() => {
      navigate("/learn");
    }, 1400);
    return () => window.clearTimeout(t);
  }, [introCompleted, navigate]);

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
            Walk up to the NPC, read the intro, type your first message, and run it. No sign-in needed.
          </p>
        </div>

        <div className={styles.demoGrid}>
          <div className={styles.demoGameCard} ref={gameWrapRef}>
            <div className={styles.demoGameTop}>
              <div className={styles.demoGameTopLeft}>
                <span className={styles.demoPill}>Tutorial</span>
                <span className={styles.demoQuestName}>Meet the NPC and run your first "program"</span>
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

          <HomeDemoTerminal
            mode="intro"
            armed={introOpen}
            quest={quest}
            onIntroComplete={() => {
              setIntroCompleted(true);
              window.dispatchEvent(new CustomEvent("code-mania:close-quest-hud"));
            }}
            onGoLearn={() => navigate("/learn")}
          />
        </div>
      </div>
    </section>
  );
}
