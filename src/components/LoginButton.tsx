"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import styles from "./LoginButton.module.css";

export function LoginButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className={styles.loading}>로딩중...</div>;
  }

  if (session) {
    return (
      <div className={styles.userMenu}>
        <img
          src={session.user?.image || ""}
          alt="👤"
          className={styles.avatar}
        />
        <span className={styles.userName}>{session.user?.name}</span>
        <button className={styles.logoutBtn} onClick={() => signOut()}>
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <button className={styles.loginBtn} onClick={() => signIn("google")}>
      Google로 로그인
    </button>
  );
}
