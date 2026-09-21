import * as React from "react";
import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Text,
} from "@react-email/components";

type VerificationEmailProps = {
    email: string;
    otp: string;
};

export default function VerificationCompo({
    email,
    otp,
}: VerificationEmailProps) {
    return (
        <Html lang="en" dir="ltr">
            <Head />
            <Preview>Your verification code is {otp}</Preview>

            <Body style={main}>
                <Container style={container}>
                    <Heading style={heading}>Verify your email</Heading>

                    <Text style={text}>Hello {email},</Text>

                    <Text style={text}>
                        Thank you for signing up. Please use the verification code below to
                        complete your email verification.
                    </Text>

                    <Section style={codeBox}>
                        <Text style={code}>{otp}</Text>
                    </Section>

                    <Text style={text}>
                        This code is valid for a limited time. Please do not share it with
                        anyone.
                    </Text>

                    <Text style={footer}>
                        If you did not create this account, you can safely ignore this
                        email.
                    </Text>
                </Container>
            </Body>
        </Html>
    );
}

const main = {
    backgroundColor: "#f4f4f7",
    fontFamily: "Arial, sans-serif",
    padding: "40px 0",
};

const container = {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "32px",
    borderRadius: "12px",
    maxWidth: "480px",
};

const heading = {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#111827",
    textAlign: "center" as const,
    marginBottom: "24px",
};

const text = {
    fontSize: "16px",
    color: "#374151",
    lineHeight: "24px",
    margin: "12px 0",
};

const codeBox = {
    backgroundColor: "#f3f4f6",
    borderRadius: "10px",
    padding: "20px",
    margin: "24px 0",
    textAlign: "center" as const,
};

const code = {
    fontSize: "32px",
    fontWeight: "bold",
    letterSpacing: "6px",
    color: "#111827",
    margin: "0",
};

const footer = {
    fontSize: "14px",
    color: "#6b7280",
    lineHeight: "22px",
    marginTop: "24px",
};