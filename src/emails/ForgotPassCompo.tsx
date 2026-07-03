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

type ForgotPasswordEmailProps = {
    email?: string;
    otp?: string;
};

export default function ForgotPasswordEmail({
    email = "goma",
    otp = "sultan",
}: ForgotPasswordEmailProps) {
    return (
        <Html lang="en" dir="ltr">
            <Head />
            <Preview>Your password reset code is {otp}</Preview>

            <Body style={main}>
                <Container style={container}>
                    <Heading style={heading}>Reset your password</Heading>

                    <Text style={text}>Hello {email},</Text>

                    <Text style={text}>
                        You requested to reset your password. Please use the verification code below to
                        complete the process.
                    </Text>

                    <Section style={codeBox}>
                        <Text style={code}>{otp}</Text>
                    </Section>

                    <Text style={text}>
                        This code is valid for a limited time. If you did not request this, please ignore this email.
                    </Text>

                    <Text style={footer}>
                        Security is our priority.
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
