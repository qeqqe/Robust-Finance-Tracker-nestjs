"use client";
import React from "react";

const page = () => {
  const token = localStorage.getItem("access_token");
  return <div>Hello {token}</div>;
};

export default page;
