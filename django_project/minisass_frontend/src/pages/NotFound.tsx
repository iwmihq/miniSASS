import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AppShell from "../components/AppShell";
import { globalVariables } from "../utils";

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AppShell>
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <img
            src={`${globalVariables.staticPath}img_notov1crab.svg`}
            alt=""
            className="mb-6 h-24 w-24 opacity-40"
          />
          <h1 className="mb-2 font-raleway text-display-lg text-primary">404</h1>
          <h2 className="mb-4 font-raleway text-heading text-text">
            Page not found
          </h2>
          <p className="mb-8 max-w-md text-body text-text-muted">
            The page you are looking for does not exist or has been moved.
            Let's get you back on track.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="rounded-tr-2xl rounded-bl-2xl rounded-br-2xl bg-accent px-6 py-3 text-body-sm font-semibold text-text-inverse transition-colors hover:bg-accent-dark"
            >
              Go Home
            </button>
            <button
              onClick={() => navigate("/map")}
              className="rounded-tr-2xl rounded-bl-2xl rounded-br-2xl border-2 border-primary px-6 py-3 text-body-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-text-inverse"
            >
              Explore the Map
            </button>
            <button
              onClick={() => navigate(-1 as any)}
              className="rounded-tr-2xl rounded-bl-2xl rounded-br-2xl border-2 border-surface-muted px-6 py-3 text-body-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
            >
              Go Back
            </button>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
};

export default NotFound;
