"use client";

import PageContentWrapper from "@/app/components/PageContentWrapper/PageContentWrapper";

import styles from "./AiAgents.module.css";
import PageContentHeader from "../../components/PageContentHeader/PageContentHeader";

export default function AiAgentsPage() {
    return (
        <PageContentWrapper>
            <PageContentHeader title="AI Agents" />
            <ul className={styles.agentsList}>
                <li>
                    <a href="/user/aiAgents/coverLetter">Cover Letter Agent</a>
                </li>
                <li>
                    <a href="/user/aiAgents/resume">Resume Agent</a>
                </li>
                <li>
                    <a href="/user/aiAgents/professionalHeadshot">Professional Headshot Agent</a>
                </li>
            </ul>
        </PageContentWrapper>
    );
}