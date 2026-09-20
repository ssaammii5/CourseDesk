export * from "@/types/user";
import type { LearnerProfile } from "@/types/user";

export const currentLearnerProfile: LearnerProfile = {
    fullName: "Md. Samiur Rahman",
    fathersName: "Father Name Here",
    mothersName: "Mother Name Here",
    dateOfBirth: "2002-05-15",
    mobile: "+880 1712-345678",
    nationality: "Bangladeshi",
    learnerId: "201-15-0000",
    studentId: "201-15-0000",
    regNo: "1234567890",
    department: "Computer Science and Engineering",
    currentProgram: "Undergraduate",
    session: "2021-2022",
    level: 1,
    semester: 1,
    permanentAddress: {
        street: "House 12, Road 5, Dhanmondi",
        city: "Dhaka",
        state: "Dhaka Division",
        zip: "1205",
        country: "Bangladesh",
    },
};

export const currentStudentProfile = currentLearnerProfile;