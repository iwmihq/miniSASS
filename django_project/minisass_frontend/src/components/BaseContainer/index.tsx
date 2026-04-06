import React from "react";
import AppShell from "../AppShell";

export default function BaseContainer(props: { children: any }) {
  return (
    <AppShell showFooterLogos={false}>
      <div className="mx-auto mt-8 max-w-5xl px-4 sm:px-6 lg:px-8">
        {props.children}
      </div>
    </AppShell>
  );
}
