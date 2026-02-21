package uz.pravaimtihon.exception;

/**
 * File Storage Exception
 * Used for all file storage related errors
 */
public class FileStorageException extends RuntimeException {

    public FileStorageException(String message) {
        super(message);
    }

    public FileStorageException(String message, Throwable cause) {
        super(message, cause);
    }
}