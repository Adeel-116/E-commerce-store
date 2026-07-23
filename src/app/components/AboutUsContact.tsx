"use client";
import React, { useState } from "react";
import "../styles/about-us.css";
import axios from "axios";
const AboutUsContact = () => {
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        contact: "",
        message: "",
    });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSubmitted(false);
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/contact-us`, form);
            setSubmitted(true);
            setForm({ fullName: "", email: "", contact: "", message: "" });
            setTimeout(() => setSubmitted(false), 5000);
        } catch (err: any) {
            setError(
                err?.response?.data?.message ?? "Failed to send message. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="au-contact">
            <div className="au-contact__inner">

                {/* Info Side */}
                <div className="au-contact__info">
                    <p className="about-tag">Reach Out</p>
                    <h2 className="au-contact__heading">Get In Touch</h2>
                    <p className="au-contact__subtext">
                        Have a question, a special request, or just want to talk fragrances?
                        We&apos;d love to hear from you. Our team typically responds within 24 hours.
                    </p>
                    <div className="au-contact__details">
                        <div className="au-contact__detail-item">
                            <span className="au-contact__detail-icon">✉</span>
                            <a href="mailto:info@monkscents.com">info@monkscents.com</a>
                        </div>
                        <div className="au-contact__detail-item">
                            <span className="au-contact__detail-icon">☎</span>
                            <a href="tel:+971585478910">+971 585478910</a>
                        </div>
                        {/* <div className="au-contact__detail-item">
                            <span className="au-contact__detail-icon">◎</span>
                            <span>Dubai, United Arab Emirates</span>
                        </div> */}
                    </div>
                </div>

                {/* Form Side */}
                <form className="au-contact__form" onSubmit={handleSubmit} noValidate>
                    {submitted && (
                        <div className="au-contact__success">
                            Thank you! Your message has been sent. We&apos;ll be in touch shortly.
                        </div>
                    )}

                    {error && (
                        <div className="au-contact__error">
                            {error}
                        </div>
                    )}

                    <div className="au-contact__row">
                        <div className="au-contact__field">
                            <label className="au-form__label" htmlFor="fullName">
                                Full Name
                            </label>
                            <input
                                className="au-contact__input"
                                type="text"
                                id="fullName"
                                name="fullName"
                                placeholder="John Doe"
                                value={form.fullName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="au-contact__field">
                            <label className="au-form__label" htmlFor="email">
                                Email Address
                            </label>
                            <input
                                className="au-contact__input"
                                type="email"
                                id="email"
                                name="email"
                                placeholder="john@example.com"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="au-contact__field">
                        <label className="au-form__label" htmlFor="contact">
                            Contact Number
                        </label>
                        <input
                            className="au-contact__input"
                            type="tel"
                            id="contact"
                            name="contact"
                            placeholder="+1 234 567 8900"
                            value={form.contact}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="au-contact__field">
                        <label className="au-form__label" htmlFor="message">
                            Message
                        </label>
                        <textarea
                            className="au-contact__textarea"
                            id="message"
                            name="message"
                            rows={5}
                            placeholder="Tell us how we can help you..."
                            value={form.message}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button
                        className="au-contact__submit"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Sending..." : "Send Message"}
                    </button>
                </form>
            </div>
        </section>
    );
};

export default AboutUsContact;
