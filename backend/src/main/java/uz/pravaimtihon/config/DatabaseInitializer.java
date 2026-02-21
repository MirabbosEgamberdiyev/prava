package uz.pravaimtihon.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.context.EnvironmentAware;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

/**
 * Automatically creates the PostgreSQL database if it doesn't exist.
 * Implements BeanFactoryPostProcessor to run BEFORE Flyway and DataSource initialization.
 */
@Component
@Slf4j
public class DatabaseInitializer implements BeanFactoryPostProcessor, EnvironmentAware {

    private Environment environment;

    @Override
    public void setEnvironment(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {
        String url = environment.getProperty("spring.datasource.url");
        String username = environment.getProperty("spring.datasource.username", "postgres");
        String password = environment.getProperty("spring.datasource.password", "");

        if (url == null || !url.contains("postgresql")) {
            return;
        }

        String dbName;
        try {
            String withoutParams = url.split("\\?")[0];
            dbName = withoutParams.substring(withoutParams.lastIndexOf('/') + 1);
        } catch (Exception e) {
            log.warn("Could not parse database name from URL: {}", url);
            return;
        }

        String baseUrl = url.substring(0, url.lastIndexOf('/')) + "/postgres";
        if (baseUrl.contains("?")) {
            baseUrl = baseUrl.split("\\?")[0];
        }

        try (Connection conn = DriverManager.getConnection(baseUrl, username, password)) {
            try (ResultSet rs = conn.createStatement().executeQuery(
                    "SELECT 1 FROM pg_database WHERE datname = '" + dbName.replace("'", "''") + "'")) {
                if (!rs.next()) {
                    try (Statement stmt = conn.createStatement()) {
                        stmt.executeUpdate("CREATE DATABASE " + dbName);
                        log.info("Database '{}' created successfully", dbName);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not auto-create database '{}': {}", dbName, e.getMessage());
        }
    }
}
