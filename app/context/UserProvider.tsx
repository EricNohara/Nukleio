"use client";

import { createContext, useContext, useReducer, useEffect } from "react";

import { IApiKeyInternal } from "../interfaces/IApiKey";
import { ICourseInput } from "../interfaces/ICourse";
import { IExperience } from "../interfaces/IExperience";
import { IProjectInput } from "../interfaces/IProject";
import { IPublicApiLogInternal } from "../interfaces/IPublicApiLog";
import { ISkillsInput } from "../interfaces/ISkills";
import IUser from "../interfaces/IUser";
import { IUserEducationInternal } from "../interfaces/IUserInfoInternal";
import { IUserInfoInternal } from "../interfaces/IUserInfoInternal";

type Action =
    | { type: "SET_ALL_DATA"; payload: IUserInfoInternal }
    | { type: "SET_USER"; payload: IUser }
    | { type: "ADD_EXPERIENCE"; payload: IExperience }
    | { type: "UPDATE_EXPERIENCE"; payload: { old: IExperience, new: IExperience } }
    | { type: "DELETE_EXPERIENCE"; payload: IExperience }
    | { type: "ADD_SKILL"; payload: ISkillsInput }
    | { type: "UPDATE_SKILL"; payload: { old: ISkillsInput, new: ISkillsInput } }
    | { type: "DELETE_SKILL"; payload: ISkillsInput }
    | { type: "ADD_PROJECT"; payload: IProjectInput }
    | { type: "UPDATE_PROJECT"; payload: { old: IProjectInput, new: IProjectInput } }
    | { type: "DELETE_PROJECT"; payload: IProjectInput }
    | { type: "ADD_EDUCATION"; payload: IUserEducationInternal }
    | { type: "UPDATE_EDUCATION"; payload: { old: IUserEducationInternal, new: IUserEducationInternal } }
    | { type: "DELETE_EDUCATION"; payload: IUserEducationInternal }
    | { type: "ADD_COURSE"; payload: { educationID: number; course: ICourseInput } }
    | { type: "UPDATE_COURSE"; payload: { educationID: number; courseName: string; newCourse: ICourseInput } }
    | { type: "DELETE_COURSE"; payload: { educationID: number; courseIndex: number } }
    | { type: "ADD_API_KEY"; payload: IApiKeyInternal }
    | { type: "UPDATE_API_KEY"; payload: { old: IApiKeyInternal, new: IApiKeyInternal } }
    | { type: "DELETE_API_KEY"; payload: IApiKeyInternal }
    | { type: "REFRESH_PUBLIC_API_LOGS"; payload: IPublicApiLogInternal[] };

const initialState: IUserInfoInternal = {
    email: "",
    name: null,
    bio: null,
    current_position: null,
    current_company: null,
    phone_number: null,
    current_address: null,
    github_url: null,
    linkedin_url: null,
    portrait_url: null,
    resume_url: null,
    transcript_url: null,
    facebook_url: null,
    instagram_url: null,
    x_url: null,
    skills: [],
    experiences: [],
    projects: [],
    education: [],
    api_keys: [],
    public_api_logs: []
};

const UserContext = createContext<{
    state: IUserInfoInternal;
    dispatch: React.Dispatch<Action>;
}>({
    state: initialState,
    dispatch: () => { },
});

function reducer(state: IUserInfoInternal, action: Action): IUserInfoInternal {
    switch (action.type) {
        case "SET_ALL_DATA":
            return action.payload;
        case "SET_USER":
            const { skills, experiences, projects, education, api_keys, public_api_logs, ...rest } = state;
            return {
                ...rest,
                ...action.payload,
                skills,
                experiences,
                projects,
                education,
                api_keys,
                public_api_logs
            };

        // --- EXPERIENCES ---
        case "ADD_EXPERIENCE":
            return { ...state, experiences: [...state.experiences, action.payload] };
        case "UPDATE_EXPERIENCE":
            return {
                ...state,
                experiences: state.experiences.map((exp) =>
                    exp === action.payload.old ? action.payload.new : exp
                ),
            };
        case "DELETE_EXPERIENCE":
            return {
                ...state,
                experiences: state.experiences.filter((exp) => exp !== action.payload),
            };

        // --- SKILLS ---
        case "ADD_SKILL":
            return { ...state, skills: [...state.skills, action.payload] };
        case "UPDATE_SKILL":
            return {
                ...state,
                skills: state.skills.map((s) =>
                    s === action.payload.old ? action.payload.new : s
                ),
            };
        case "DELETE_SKILL":
            return {
                ...state,
                skills: state.skills.filter((s) => s !== action.payload),
            };

        // --- PROJECTS ---
        case "ADD_PROJECT":
            return { ...state, projects: [...state.projects, action.payload] };
        case "UPDATE_PROJECT":
            return {
                ...state,
                projects: state.projects.map((p) =>
                    p === action.payload.old ? action.payload.new : p
                ),
            };
        case "DELETE_PROJECT":
            return {
                ...state,
                projects: state.projects.filter((p) => p !== action.payload),
            };

        // --- EDUCATION ---
        case "ADD_EDUCATION":
            return { ...state, education: [...state.education, action.payload] };
        case "UPDATE_EDUCATION":
            return {
                ...state,
                education: state.education.map((edu) =>
                    edu === action.payload.old ? action.payload.new : edu
                ),
            };
        case "DELETE_EDUCATION":
            return {
                ...state,
                education: state.education.filter((edu) => edu !== action.payload),
            };

        // --- COURSES ---
        case "ADD_COURSE":
            return {
                ...state,
                education: state.education.map((edu, idx) =>
                    idx === action.payload.educationIndex
                        ? { ...edu, courses: [...edu.courses, action.payload.course] }
                        : edu
                ),
            };
        case "DELETE_COURSE":
            return {
                ...state,
                education: state.education.map((edu, idx) =>
                    idx === action.payload.educationIndex
                        ? {
                            ...edu,
                            courses: edu.courses.filter(
                                (_, cIdx) => cIdx !== action.payload.courseIndex
                            ),
                        }
                        : edu
                ),
            };
        case "UPDATE_COURSE":
            return {
                ...state,
                education: state.education.map((edu, idx) =>
                    idx === action.payload.educationIndex
                        ? {
                            ...edu,
                            courses: edu.courses.map((course, cIdx) =>
                                cIdx === action.payload.courseIndex ? action.payload.newCourse : course
                            ),
                        }
                        : edu
                ),
            };

        // --- API_KEYS ---
        case "ADD_API_KEY":
            return { ...state, api_keys: [...state.api_keys, action.payload] };
        case "UPDATE_API_KEY":
            return {
                ...state,
                api_keys: state.api_keys.map((k) =>
                    k === action.payload.old ? action.payload.new : k
                ),
            };
        case "DELETE_API_KEY":
            return {
                ...state,
                api_keys: state.api_keys.filter((k) => k !== action.payload),
            };

        // --- PUBLIC_API_LOGS ---
        case "REFRESH_PUBLIC_API_LOGS":
            return { ...state, public_api_logs: action.payload };

        default:
            return state;
    }
}

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        const fetcher = async () => {
            const res = await fetch("/api/internal/user/info");
            const data = await res.json();
            dispatch({ type: "SET_ALL_DATA", payload: data.userInfoInternal });
        };
        fetcher();
    }, []);

    return (
        <UserContext.Provider value={{ state, dispatch }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => useContext(UserContext);