import React from "react";

export const metadata = {
  title: "About Us",
  description: "About page",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl text-center">
        <h1 className="text-3xl font-bold mb-4">About Us</h1>
        <p className="text-gray-600">
          This is the About page. You can customize or remove this page later.
        </p>
      </div>
    </main>
  );
}
