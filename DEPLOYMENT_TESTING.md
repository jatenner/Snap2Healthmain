# Snap2Health Deployment Testing Guide

This guide will help you verify that your Snap2Health deployment is working correctly with all the implemented memory optimizations and authentication fixes.

## 1. Authentication Testing

### Login Testing
1. Open the deployed site in a private/incognito browser window
2. Click on "Login" or navigate to `/login`
3. Enter your credentials and click Sign In
4. Verify you are successfully logged in and redirected to the dashboard
5. Check the browser console for any errors (especially "Multiple GoTrueClient instances detected")

### Session Persistence Testing
1. Refresh the page while logged in
2. Verify you remain logged in
3. Navigate to different sections of the app
4. Verify your session persists across all pages

### Edge Cases
1. Try logging in on multiple devices or browsers simultaneously
2. Verify each session works independently without conflicts
3. Try the "Having trouble logging in?" option on the login page if you encounter issues

## 2. Memory Optimization Testing

### Image Analysis Testing
1. Navigate to the meal analysis section
2. Upload a food image (try pasta with meatballs)
3. Verify the analysis completes without errors
4. Check that you get comprehensive nutritional information:
   - Macronutrients (protein, carbs, fat)
   - Micronutrients (vitamins, minerals)
   - Calorie information
   - AI-generated personalized overview

### Performance Testing
1. Try analyzing multiple meals in succession
2. Verify the app remains responsive
3. Look for any "server error" messages or timeouts
4. Check the browser console for any memory-related warnings

## 3. UI/UX Testing

### Responsive Design
1. Test the site on different devices (desktop, tablet, mobile)
2. Verify all elements render correctly and are usable
3. Check that images and analysis results display properly

### Navigation
1. Verify all navigation links work correctly
2. Test the user profile/settings sections
3. Check that back buttons and breadcrumbs work as expected

## 4. Error Handling Testing

### Network Resilience
1. Try using the app with slow internet connection
2. Verify appropriate loading states appear
3. Check that the app recovers gracefully from network interruptions

### Input Validation
1. Test with various image types and sizes
2. Try invalid inputs where applicable
3. Verify clear error messages are shown for invalid inputs

## 5. Browser Compatibility

1. Test on different browsers (Chrome, Safari, Firefox, Edge)
2. Verify all functionality works consistently across browsers
3. Pay special attention to the authentication flow in different browsers

## Troubleshooting Common Issues

### Authentication Issues
- If you see "Multiple GoTrueClient instances" errors, use the "Having trouble logging in?" option
- Clear browser cache and cookies, then try again
- Verify your Supabase configuration in the environment variables

### Memory Issues
- If image analysis fails with a timeout, the server might be experiencing memory pressure
- Try uploading a smaller or compressed image
- Contact the deployment team if issues persist

### Performance Issues
- If the app seems slow, check your network connection
- Try clearing browser cache
- Verify that no browser extensions are interfering with the application

## Reporting Issues

If you encounter any issues that aren't resolved by the troubleshooting steps above, please report them with:

1. Detailed description of the issue
2. Steps to reproduce
3. Browser and device information
4. Screenshots or error messages from the console
5. Approximate time when the issue occurred

Happy testing! 