import useAxiosPrivate from "../hooks/useAxiosPrivate";

const useSessionOut = () => {
  const axiosPrivate = useAxiosPrivate();

  const SessionOut = async () => {

    try {
      const response = await axiosPrivate.post("/v1/account/logout", {});
      
      console.log("Sign-out response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  return SessionOut;
};

const clearUserSession = () => {
  const username = localStorage.getItem('username');

  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('username');
  localStorage.removeItem('fullName');
  localStorage.removeItem('needsUsername');

  localStorage.removeItem('selectedCharacter');
  localStorage.removeItem('selectedCharacterIcon');

  localStorage.removeItem('hasSeenOnboarding');
  localStorage.removeItem('hasCompletedOnboarding');

  localStorage.removeItem('hasTouchedCourse');
  localStorage.removeItem('lastCourseTitle');
  localStorage.removeItem('lastCourseRoute');

  localStorage.removeItem('earnedAchievements');

  if (username) {
    localStorage.removeItem(`${username}_javascript_completed_exercises`);
    localStorage.removeItem(`${username}_cpp_completed_exercises`);
    localStorage.removeItem(`${username}_python_completed_exercises`);
  }

  localStorage.removeItem('javascript_completed_exercises');
  localStorage.removeItem('cpp_completed_exercises');
  localStorage.removeItem('python_completed_exercises');

  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;

    if (key.startsWith('cutscene_')) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
};

export { clearUserSession };

export default useSessionOut;
