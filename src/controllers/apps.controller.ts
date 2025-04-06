import { Request, Response } from 'express';
import App, { IApp, ImplementationState, DeploymentStatus, AppStatus } from '../models/App';

/**
 * Create a new app
 * @route POST /api/apps
 */
export const createApp = async (req: Request, res: Response) => {
  try {
    const { appName, description, implementationState, deploymentStatus, status } = req.body;

    // Check if app with same name exists
    const existingApp = await App.findOne({ appName });
    if (existingApp) {
      return res.status(400).json({ message: 'An app with this name already exists' });
    }

    // Generate appId from the first part of appName and 4 random digits
    const firstPart = appName.split(' ')[0].toLowerCase();
    const randomDigits = Math.floor(1000 + Math.random() * 9000); // Generate a number between 1000-9999
    const appId = `${firstPart}${randomDigits}`;
    
    // Check if generated appId already exists
    const existingAppId = await App.findOne({ appId });
    if (existingAppId) {
      // If appId already exists, regenerate it
      return createApp(req, res);
    }

    // Create new app
    const app = await App.create({
      appName,
      appId,
      description,
      implementationState: implementationState || ImplementationState.PLANNING,
      deploymentStatus: deploymentStatus || DeploymentStatus.PENDING,
      status: status || AppStatus.INACTIVE
    });

    res.status(201).json(app);
  } catch (error) {
    console.error('Error creating app:', error);
    res.status(500).json({ message: 'Error creating app' });
  }
};

/**
 * Get all apps
 * @route GET /api/apps
 */
export const getApps = async (req: Request, res: Response) => {
  try {
    const apps = await App.find().sort({ createdAt: -1 });
    res.status(200).json(apps);
  } catch (error) {
    console.error('Error fetching apps:', error);
    res.status(500).json({ message: 'Error fetching apps' });
  }
};

/**
 * Get app by ID
 * @route GET /api/apps/:appId
 */
export const getAppById = async (req: Request, res: Response) => {
  try {
    const app = await App.findOne({ appId: req.params.appId });
    if (!app) {
      return res.status(404).json({ message: 'App not found' });
    }
    res.status(200).json(app);
  } catch (error) {
    console.error('Error fetching app:', error);
    res.status(500).json({ message: 'Error fetching app' });
  }
};

/**
 * Update app
 * @route PUT /api/apps/:appId
 */
export const updateApp = async (req: Request, res: Response) => {
  try {
    // Remove appName from updateData to prevent updates to app name
    const { appName, ...updateData } = req.body;

    // if (appName) {
    //   return res.status(400).json({ message: 'App name cannot be updated' });
    // }

    const app = await App.findOneAndUpdate(
      { appId: req.params.appId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!app) {
      return res.status(404).json({ message: 'App not found' });
    }

    res.status(200).json(app);
  } catch (error) {
    console.error('Error updating app:', error);
    res.status(500).json({ message: 'Error updating app' });
  }
};

/**
 * Delete app
 * @route DELETE /api/apps/:appId
 */
export const deleteApp = async (req: Request, res: Response) => {
  try {
    const app = await App.findOneAndDelete({ appId: req.params.appId });
    if (!app) {
      return res.status(404).json({ message: 'App not found' });
    }
    res.status(200).json({ message: 'App deleted successfully' });
  } catch (error) {
    console.error('Error deleting app:', error);
    res.status(500).json({ message: 'Error deleting app' });
  }
};