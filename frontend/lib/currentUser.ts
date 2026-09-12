export * from "@/types/user";
import type { StudentProfile } from "@/types/user";

export const currentStudentProfile: StudentProfile = {
    fullName: "Md. Samiur Rahman",
    fathersName: "Father Name Here",
    mothersName: "Mother Name Here",
    dateOfBirth: "2002-05-15",
    mobile: "+880 1712-345678",
    nationality: "Bangladeshi",
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