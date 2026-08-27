// Mock Storage Service — returns fake URLs instead of uploading to Firebase Storage

export async function uploadFile(file, path) {
    // Create a fake object URL for local testing
    const fakeUrl = URL.createObjectURL(file);
    return fakeUrl;
}

export async function uploadResume(file, userId) {
    return uploadFile(file, `resumes/${userId}/${file.name}`);
}

export async function uploadLogo(file, companyId) {
    return uploadFile(file, `logos/${companyId}/${file.name}`);
}

export async function uploadProfilePicture(file, userId) {
    return uploadFile(file, `profile_pictures/${userId}/${file.name}`);
}
