# Snap2Health Deployment Testing Plan

This document outlines the steps to verify that all our caching and deployment fixes are working correctly in the production environment (snap2health.com).

## 1. Version Verification

- [ ] Check the footer of the app to verify the version timestamp is present and recent
- [ ] Visit /api/version to confirm the API is returning the correct build timestamp
- [ ] Verify the timestamp matches what's displayed in the UI

## 2. Cache Busting Tests

- [ ] Clear browser cache and visit the site to establish a baseline
- [ ] Visit the /clear-cache.html page and confirm it successfully redirects to the home page
- [ ] Make a small edit to the site locally, deploy, and verify the changes appear without having to hard refresh
- [ ] Test image uploading and confirm the images display without caching issues
- [ ] Verify that the client-side cache busting is working by checking network requests for timestamp parameters

## 3. Core Functionality Tests

- [ ] Create an account or log in with an existing account 
- [ ] Take a photo of a meal and analyze it 
- [ ] Verify that all nutrition panels display correctly with descriptions
- [ ] Test the Health Goal Analysis section with various health goals
- [ ] Check that all tabs in the analysis view work correctly
- [ ] Verify all images load properly in the analysis view
- [ ] Test meal history functionality

## 4. Error Handling and Edge Cases

- [ ] Test with a poor quality or unrecognizable food image
- [ ] Test with a non-food image
- [ ] Submit an empty form to verify error handling
- [ ] Test with a very large image file
- [ ] Test on mobile devices to verify responsive design 

## 5. Deployment Verification

- [ ] Verify in Vercel deployment logs that there are no webpack cache errors
- [ ] Check that the build completes successfully 
- [ ] Verify HTTP cache headers are set correctly using browser DevTools
- [ ] Check the Content-Type headers on images and static assets

## 6. Performance Testing

- [ ] Measure page load times before and after implementing our fixes
- [ ] Check Lighthouse scores for performance improvements
- [ ] Verify image loading performance with cache busting parameters
- [ ] Monitor server response times for API calls

## Bug Tracking

For any issues discovered during testing, document the following:

1. Issue description
2. Steps to reproduce
3. Expected behavior 
4. Actual behavior
5. Screenshots if applicable
6. Browser/device information

## Success Criteria

The deployment will be considered successful if:

- All cache-related issues are resolved
- UI updates appear immediately after deployment
- Images load fresh versions without requiring hard refresh
- All core functionality works correctly
- No module not found errors in the console
- No webpack cache errors in the deployment logs 