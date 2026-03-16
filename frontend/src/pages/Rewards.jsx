import React from "react";
import styles from "../styles/Rewards.module.css";

const giftIcon = "https://res.cloudinary.com/daegpuoss/image/upload/v1773395251/gift_bt526r.png";

export default function Rewards() {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.kicker}>
            <img className={styles.kickerIcon} src={giftIcon} alt="" aria-hidden="true" />
            <span>QUESTS & REWARDS</span>
          </div>
          <h1 className={styles.title}>DESIGNED FOR GAME PLAYERS</h1>
          <p className={styles.subtitle}>
            Accept quests, keep learning, and collect rewards for showing up.
          </p>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.steps}>
          <article className={styles.card} style={{ animationDelay: "80ms" }}>
            <div className={styles.cardFrame}>
              <div className={styles.screen}>
                <div className={styles.screenTop}>
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                </div>
                <div className={styles.screenBody}>
                  <div className={styles.questRow}>
                    <img className={styles.questIcon} src={giftIcon} alt="" aria-hidden="true" />
                    <div className={styles.questText}>
                      <div className={styles.questTitle}>Greed Run Quest</div>
                      <div className={styles.questDesc}>Play or code for 15 minutes to earn a reward.</div>
                    </div>
                  </div>
                  <button type="button" className={styles.cta} disabled>
                    Accept Quest
                  </button>
                </div>
              </div>
            </div>
            <div className={styles.stepLabel}>1. THEY ACCEPT YOUR QUEST</div>
          </article>

          <article className={styles.card} style={{ animationDelay: "160ms" }}>
            <div className={styles.cardFrame}>
              <div className={styles.screen}>
                <div className={styles.screenTop}>
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                </div>
                <div className={styles.screenBody}>
                  <div className={styles.progressTitle}>You&apos;re so close!</div>
                  <div className={styles.progressSub}>Keep going to complete the quest.</div>
                  <div className={styles.progressBar} role="progressbar" aria-valuenow={75} aria-valuemin={0} aria-valuemax={100}>
                    <div className={styles.progressFill} style={{ width: "75%" }} />
                  </div>
                  <div className={styles.progressPct}>75%</div>
                </div>
              </div>
            </div>
            <div className={styles.stepLabel}>2. PLAY OR WATCH</div>
          </article>

          <article className={styles.card} style={{ animationDelay: "240ms" }}>
            <div className={styles.cardFrame}>
              <div className={styles.screen}>
                <div className={styles.screenTop}>
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                </div>
                <div className={styles.screenBody}>
                  <div className={styles.confetti} aria-hidden="true" />
                  <div className={styles.modal}>
                    <div className={styles.modalTitle}>Congratulations!</div>
                    <div className={styles.modalText}>Your reward is ready. Use it anytime on your profile.</div>
                    <button type="button" className={styles.cta} disabled>
                      Use Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.stepLabel}>3. AND COLLECT REWARDS</div>
          </article>
        </section>
      </main>
    </div>
  );
}
